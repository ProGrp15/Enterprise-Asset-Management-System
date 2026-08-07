using Dapper;
using MySqlConnector;

namespace Assetflow.AssetService.Services
{
    public class AssetDataService
    {
        private readonly MySqlConnection _db;

        public AssetDataService(MySqlConnection db)
        {
            _db = db;
        }

        public async Task<IEnumerable<IDictionary<string, object>>> ListAsync(string type, long company, long user, string role, string? search, int page, int size)
        {
            page = Math.Max(0, page);
            size = Math.Min(Math.Max(1, size), 100);
            var sql = BaseQuery(type);
            var parameters = new DynamicParameters();
            parameters.Add("company", company);

            if (role == "EMPLOYEE")
            {
                if (type == "asset")
                {
                    sql += " and a.asset_id in (select asset_id from asset_allocations where company_id=@company and employee_id=@user and allocation_status='ACTIVE')";
                    parameters.Add("user", user);
                }
                else if (type == "category")
                {
                    // Employees may browse categories
                }
                else if (type == "asset-request")
                {
                    sql += " and ar.employee_id=@user";
                    parameters.Add("user", user);
                }
                else if (type == "asset-return")
                {
                    sql += " and ar.employee_id=@user";
                    parameters.Add("user", user);
                }
                else if (type == "maintenance")
                {
                    sql += " and m.employee_id=@user";
                    parameters.Add("user", user);
                }
                else
                {
                    throw new UnauthorizedAccessException("Employee access is limited");
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var filter = SearchFilter(type);
                sql += " and (" + filter + ")";
                parameters.Add("search", $"%{search}%");
            }

            sql += $" order by {QualifiedKey(type)} desc limit @size offset @offset";
            parameters.Add("size", size);
            parameters.Add("offset", page * size);

            var result = await _db.QueryAsync<dynamic>(sql, parameters);
            return result.Cast<IDictionary<string, object>>();
        }

        public async Task<IDictionary<string, object>> OneAsync(string type, long company, long user, string role, long id)
        {
            await EnsureOwnedAsync(type, company, id);
            if (role == "EMPLOYEE")
            {
                if (type == "asset")
                {
                    await EnsureAssignedAsync(company, user, id);
                }
                else if (type is not ("asset-request" or "asset-return" or "maintenance"))
                {
                    throw new UnauthorizedAccessException("Employee access is limited");
                }
                else
                {
                    await EnsureEmployeeRecordAsync(type, company, user, id);
                }
            }
            var sql = BaseQuery(type) + $" and {QualifiedKey(type)}=@id";
            var result = await _db.QuerySingleOrDefaultAsync<dynamic>(sql, new { company, id });
            return (IDictionary<string, object>)result;
        }

        public async Task EnsureEmployeeAssetAsync(long company, long employee, object? asset)
        {
            if (asset == null || string.IsNullOrWhiteSpace(asset.ToString()))
                throw new ArgumentException("An assigned asset is required");
            await EnsureAssignedAsync(company, employee, Convert.ToInt64(asset));
        }

        private async Task EnsureAssignedAsync(long company, long employee, long asset)
        {
            var count = await _db.QuerySingleOrDefaultAsync<int>("select count(*) from asset_allocations where company_id=@company and asset_id=@asset and employee_id=@employee and allocation_status='ACTIVE'", new { company, asset, employee });
            if (count == 0) throw new UnauthorizedAccessException("Access denied");
        }

        private async Task EnsureEmployeeRecordAsync(string type, long company, long employee, long id)
        {
            var count = await _db.QuerySingleOrDefaultAsync<int>($"select count(*) from {Table(type)} where {Key(type)}=@id and company_id=@company and employee_id=@employee", new { id, company, employee });
            if (count == 0) throw new UnauthorizedAccessException("Access denied");
        }

        public async Task<IDictionary<string, object>> CreateAsync(string type, long company, long actor, IDictionary<string, object> b)
        {
            await ValidateAsync(type, company, b);

            switch (type)
            {
                case "asset":
                    var poId = GetValue(b, "purchaseOrderId", "poId", "purchase_order_id");
                    var catId = GetValue(b, "categoryId", "category_id");
                    var venId = GetValue(b, "vendorId", "vendor_id");
                    var locId = GetValue(b, "locationId", "location_id");
                    var name = GetValue(b, "assetName", "asset_name");
                    var tag = GetValue(b, "assetTag", "asset_tag");
                    var serial = GetValue(b, "serialNumber", "serial_number");
                    var purDate = GetValue(b, "purchaseDate", "purchase_date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var purCost = GetValue(b, "purchaseCost", "purchase_cost") ?? 0.0;
                    var warExp = GetValue(b, "warrantyExpiry", "warranty_expiry");
                    var status = GetValue(b, "status") ?? "AVAILABLE";
                    b.TryGetValue("manufacturer", out var mfg);
                    b.TryGetValue("model", out var model);
                    b.TryGetValue("remarks", out var rem);

                    await _db.ExecuteAsync("insert into assets(company_id,category_id,vendor_id,location_id,purchase_order_id,asset_name,asset_tag,serial_number,manufacturer,model,purchase_date,purchase_cost,warranty_expiry,status,remarks) values(@company,@catId,@venId,@locId,@poId,@name,@tag,@serial,@mfg,@model,@purDate,@purCost,@warExp,@status,@rem)",
                        new { company, catId, venId, locId, poId, name, tag, serial, mfg, model, purDate, purCost, warExp, status, rem });
                    break;

                case "category":
                    var catName = GetValue(b, "categoryName", "category_name");
                    b.TryGetValue("description", out var catDesc);
                    await _db.ExecuteAsync("insert into asset_categories(company_id,category_name,description) values(@company,@catName,@catDesc)",
                        new { company, catName, catDesc });
                    break;

                case "vendor":
                    var venName = GetValue(b, "vendorName", "vendor_name");
                    var cp = GetValue(b, "contactPerson", "contact_person");
                    b.TryGetValue("email", out var venEmail);
                    b.TryGetValue("phone", out var venPhone);
                    b.TryGetValue("address", out var venAddr);
                    await _db.ExecuteAsync("insert into vendors(company_id,vendor_name,contact_person,email,phone,address) values(@company,@venName,@cp,@venEmail,@venPhone,@venAddr)",
                        new { company, venName, cp, venEmail, venPhone, venAddr });
                    break;

                case "purchase-order":
                    var poVenId = GetValue(b, "vendorId", "vendor_id");
                    var orderNo = GetValue(b, "orderNumber", "poNumber", "order_number") ?? ("PO-" + Guid.NewGuid().ToString()[..8].ToUpper());
                    var orderDate = GetValue(b, "orderDate", "order_date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var delDate = GetValue(b, "expectedDeliveryDate", "expected_delivery_date");
                    var amount = GetValue(b, "totalAmount", "total_amount") ?? 0.0;
                    var poStatus = GetValue(b, "status") ?? "DRAFT";
                    b.TryGetValue("remarks", out var poRem);
                    await _db.ExecuteAsync("insert into purchase_orders(company_id,vendor_id,order_number,order_date,expected_delivery_date,total_amount,status,remarks) values(@company,@poVenId,@orderNo,@orderDate,@delDate,@amount,@poStatus,@poRem)",
                        new { company, poVenId, orderNo, orderDate, delDate, amount, poStatus, poRem });
                    break;

                case "maintenance":
                    var mAssetId = GetValue(b, "assetId", "asset_id");
                    var empId = GetValue(b, "employeeId", "employee_id", "reportedBy", "reported_by") ?? actor;
                    var issueDesc = GetValue(b, "issueDescription", "issue_description", "description") ?? "Maintenance Issue";
                    var priority = GetValue(b, "priority") ?? "MEDIUM";
                    var mStatus = GetValue(b, "status") ?? "OPEN";
                    await _db.ExecuteAsync("insert into maintenance(company_id,asset_id,employee_id,issue_description,priority,status) values(@company,@mAssetId,@empId,@issueDesc,@priority,@mStatus)",
                        new { company, mAssetId, empId, issueDesc, priority, mStatus });
                    break;

                case "asset-allocation":
                    var allocAssetId = GetValue(b, "assetId", "asset_id");
                    var allocEmpId = GetValue(b, "employeeId", "employee_id") ?? actor;
                    var allocBy = GetValue(b, "allocatedBy", "allocated_by") ?? actor;
                    var allocDate = GetValue(b, "allocatedDate", "allocated_date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var expReturnDate = GetValue(b, "expectedReturnDate", "expected_return_date");
                    var allocStatus = GetValue(b, "allocationStatus", "allocation_status", "status") ?? "ACTIVE";
                    b.TryGetValue("remarks", out var allocRem);
                    await _db.ExecuteAsync("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,expected_return_date,allocation_status,remarks) values(@company,@allocAssetId,@allocEmpId,@allocBy,@allocDate,@expReturnDate,@allocStatus,@allocRem)",
                        new { company, allocAssetId, allocEmpId, allocBy, allocDate, expReturnDate, allocStatus, allocRem });
                    break;

                case "asset-request":
                    var reqEmpId = GetValue(b, "employeeId", "employee_id", "requestedBy") ?? actor;
                    var reqCatId = GetValue(b, "categoryId", "category_id");
                    var reqAssetId = GetValue(b, "assetId", "asset_id");
                    var reqAppBy = GetValue(b, "approvedBy", "approved_by");
                    var reqType = GetValue(b, "requestType", "request_type") ?? "NEW_ASSET";
                    var reqStatus = GetValue(b, "status") ?? "PENDING";
                    b.TryGetValue("reason", out var reqReason);
                    await _db.ExecuteAsync("insert into asset_requests(company_id,employee_id,category_id,asset_id,approved_by,request_type,reason,status) values(@company,@reqEmpId,@reqCatId,@reqAssetId,@reqAppBy,@reqType,@reqReason,@reqStatus)",
                        new { company, reqEmpId, reqCatId, reqAssetId, reqAppBy, reqType, reqReason, reqStatus });
                    break;

                case "asset-transfer":
                    var trAssetId = GetValue(b, "assetId", "asset_id");
                    var fromEmp = GetValue(b, "fromEmployeeId", "from_employee_id");
                    var toEmp = GetValue(b, "toEmployeeId", "to_employee_id");
                    var fromLoc = GetValue(b, "fromLocationId", "from_location_id");
                    var toLoc = GetValue(b, "toLocationId", "to_location_id");
                    var reqBy = GetValue(b, "requestedBy", "requested_by") ?? actor;
                    var trStatus = GetValue(b, "status") ?? "PENDING";
                    b.TryGetValue("reason", out var trReason);
                    await _db.ExecuteAsync("insert into asset_transfers(company_id,asset_id,from_employee_id,to_employee_id,from_location_id,to_location_id,requested_by,status,reason) values(@company,@trAssetId,@fromEmp,@toEmp,@fromLoc,@toLoc,@reqBy,@trStatus,@trReason)",
                        new { company, trAssetId, fromEmp, toEmp, fromLoc, toLoc, reqBy, trStatus, trReason });
                    break;

                case "asset-return":
                    var retAssetId = GetValue(b, "assetId", "asset_id");
                    var retEmpId = GetValue(b, "employeeId", "employee_id") ?? actor;
                    var retReqBy = GetValue(b, "requestedBy", "requested_by") ?? actor;
                    var cond = GetValue(b, "conditionStatus", "condition_status") ?? "GOOD";
                    var retStatus = GetValue(b, "status") ?? "PENDING";
                    b.TryGetValue("remarks", out var retRem);
                    await _db.ExecuteAsync("insert into asset_returns(company_id,asset_id,employee_id,requested_by,condition_status,remarks,status) values(@company,@retAssetId,@retEmpId,@retReqBy,@cond,@retRem,@retStatus)",
                        new { company, retAssetId, retEmpId, retReqBy, cond, retRem, retStatus });
                    break;

                case "repair-history":
                    var repAssetId = GetValue(b, "assetId", "asset_id");
                    var techId = GetValue(b, "technicianId", "technician_id") ?? actor;
                    var repDesc = GetValue(b, "issueDescription", "issue_description") ?? "Repair";
                    var repAction = GetValue(b, "repairAction", "repair_action") ?? "Diagnostic & Repair";
                    var cost = GetValue(b, "cost", "repairCost") ?? 0.0;
                    var start = GetValue(b, "startedAt", "started_at") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var comp = GetValue(b, "completedAt", "completed_at");
                    var repStatus = GetValue(b, "status") ?? "OPEN";
                    await _db.ExecuteAsync("insert into repair_history(company_id,asset_id,technician_id,issue_description,repair_action,cost,started_at,completed_at,status) values(@company,@repAssetId,@techId,@repDesc,@repAction,@cost,@start,@comp,@repStatus)",
                        new { company, repAssetId, techId, repDesc, repAction, cost, start, comp, repStatus });
                    break;

                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await LifecycleAsync(type, company, actor, b);
            await AuditAsync(company, actor, type, "CREATE", $"Created {type}");
            await NotifyCreationAsync(type, company, actor, b);

            var newId = await _db.QuerySingleAsync<long>($"select {Key(type)} from {Table(type)} where company_id=@company order by {Key(type)} desc limit 1", new { company });
            return await OneAsync(type, company, actor, "COMPANY_ADMIN", newId);
        }

        public async Task<IDictionary<string, object>> UpdateAsync(string type, long company, long actor, long id, IDictionary<string, object> b)
        {
            await EnsureOwnedAsync(type, company, id);
            var cur = await OneAsync(type, company, actor, "COMPANY_ADMIN", id);
            var merged = new Dictionary<string, object>(cur);
            if (b != null)
            {
                foreach (var kv in b) merged[kv.Key] = kv.Value;
            }

            switch (type)
            {
                case "asset":
                    var catId = GetValue(b, "categoryId", "category_id") ?? cur.GetValueOrDefault("category_id");
                    var venId = GetValue(b, "vendorId", "vendor_id") ?? cur.GetValueOrDefault("vendor_id");
                    var locId = GetValue(b, "locationId", "location_id") ?? cur.GetValueOrDefault("location_id");
                    var poId = GetValue(b, "purchaseOrderId", "poId", "purchase_order_id") ?? cur.GetValueOrDefault("purchase_order_id");
                    var name = GetValue(b, "assetName", "asset_name") ?? cur.GetValueOrDefault("asset_name");
                    var tag = GetValue(b, "assetTag", "asset_tag") ?? cur.GetValueOrDefault("asset_tag");
                    var serial = GetValue(b, "serialNumber", "serial_number") ?? cur.GetValueOrDefault("serial_number");
                    var mfg = GetValue(b, "manufacturer") ?? cur.GetValueOrDefault("manufacturer");
                    var model = GetValue(b, "model") ?? cur.GetValueOrDefault("model");
                    var purDate = GetValue(b, "purchaseDate", "purchase_date") ?? cur.GetValueOrDefault("purchase_date");
                    var purCost = GetValue(b, "purchaseCost", "purchase_cost") ?? cur.GetValueOrDefault("purchase_cost");
                    var warExp = GetValue(b, "warrantyExpiry", "warranty_expiry") ?? cur.GetValueOrDefault("warranty_expiry");
                    var status = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "AVAILABLE";
                    var remarks = GetValue(b, "remarks") ?? cur.GetValueOrDefault("remarks");

                    await _db.ExecuteAsync("update assets set category_id=@catId,vendor_id=@venId,location_id=@locId,purchase_order_id=@poId,asset_name=@name,asset_tag=@tag,serial_number=@serial,manufacturer=@mfg,model=@model,purchase_date=@purDate,purchase_cost=@purCost,warranty_expiry=@warExp,status=@status,remarks=@remarks where asset_id=@id and company_id=@company",
                        new { catId, venId, locId, poId, name, tag, serial, mfg, model, purDate, purCost, warExp, status, remarks, id, company });
                    break;

                case "category":
                    var catName = GetValue(b, "categoryName", "category_name") ?? cur.GetValueOrDefault("category_name");
                    var desc = GetValue(b, "description") ?? cur.GetValueOrDefault("description");
                    var active = GetValue(b, "isActive", "is_active") ?? cur.GetValueOrDefault("is_active") ?? true;
                    await _db.ExecuteAsync("update asset_categories set category_name=@catName,description=@desc,is_active=@active where category_id=@id and company_id=@company",
                        new { catName, desc, active, id, company });
                    break;

                case "vendor":
                    var venName = GetValue(b, "vendorName", "vendor_name") ?? cur.GetValueOrDefault("vendor_name");
                    var cp = GetValue(b, "contactPerson", "contact_person") ?? cur.GetValueOrDefault("contact_person");
                    var email = GetValue(b, "email") ?? cur.GetValueOrDefault("email");
                    var phone = GetValue(b, "phone") ?? cur.GetValueOrDefault("phone");
                    var address = GetValue(b, "address") ?? cur.GetValueOrDefault("address");
                    var vActive = GetValue(b, "isActive", "is_active") ?? cur.GetValueOrDefault("is_active") ?? true;
                    await _db.ExecuteAsync("update vendors set vendor_name=@venName,contact_person=@cp,email=@email,phone=@phone,address=@address,is_active=@vActive where vendor_id=@id and company_id=@company",
                        new { venName, cp, email, phone, address, vActive, id, company });
                    break;

                case "purchase-order":
                    var poVenId = GetValue(b, "vendorId", "vendor_id") ?? cur.GetValueOrDefault("vendor_id");
                    var orderNo = GetValue(b, "orderNumber", "poNumber", "order_number") ?? cur.GetValueOrDefault("order_number");
                    var orderDate = GetValue(b, "orderDate", "order_date") ?? cur.GetValueOrDefault("order_date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var delDate = GetValue(b, "expectedDeliveryDate", "expected_delivery_date") ?? cur.GetValueOrDefault("expected_delivery_date");
                    var amount = GetValue(b, "totalAmount", "total_amount") ?? cur.GetValueOrDefault("total_amount") ?? 0.0;
                    var poStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "DRAFT";
                    var poRemarks = GetValue(b, "remarks") ?? cur.GetValueOrDefault("remarks");
                    await _db.ExecuteAsync("update purchase_orders set vendor_id=@poVenId,order_number=@orderNo,order_date=@orderDate,expected_delivery_date=@delDate,total_amount=@amount,status=@poStatus,remarks=@poRemarks where purchase_order_id=@id and company_id=@company",
                        new { poVenId, orderNo, orderDate, delDate, amount, poStatus, poRemarks, id, company });
                    break;

                case "maintenance":
                    var mAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var empId = GetValue(b, "employeeId", "employee_id") ?? cur.GetValueOrDefault("reported_by") ?? cur.GetValueOrDefault("employee_id") ?? actor;
                    var mDesc = GetValue(b, "issueDescription", "issue_description") ?? cur.GetValueOrDefault("issue_description");
                    var priority = GetValue(b, "priority") ?? cur.GetValueOrDefault("priority") ?? "MEDIUM";
                    var mStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "OPEN";
                    var resAt = GetValue(b, "resolvedAt", "resolved_at") ?? cur.GetValueOrDefault("resolved_at");
                    await _db.ExecuteAsync("update maintenance set asset_id=@mAssetId,employee_id=@empId,issue_description=@mDesc,priority=@priority,status=@mStatus,resolved_at=@resAt where maintenance_id=@id and company_id=@company",
                        new { mAssetId, empId, mDesc, priority, mStatus, resAt, id, company });
                    break;

                case "asset-allocation":
                    var allocAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var allocEmpId = GetValue(b, "employeeId", "employee_id") ?? cur.GetValueOrDefault("employee_id");
                    var allocBy = GetValue(b, "allocatedBy", "allocated_by") ?? cur.GetValueOrDefault("allocated_by");
                    var allocDate = GetValue(b, "allocatedDate", "allocated_date") ?? cur.GetValueOrDefault("allocated_date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
                    var expReturnDate = GetValue(b, "expectedReturnDate", "expected_return_date") ?? cur.GetValueOrDefault("expected_return_date");
                    var retDate = GetValue(b, "returnedDate", "returned_date") ?? cur.GetValueOrDefault("returned_date");
                    var allocStatus = GetValue(b, "allocationStatus", "allocation_status", "status") ?? cur.GetValueOrDefault("allocation_status") ?? "ACTIVE";
                    var allocRem = GetValue(b, "remarks") ?? cur.GetValueOrDefault("remarks");
                    await _db.ExecuteAsync("update asset_allocations set asset_id=@allocAssetId,employee_id=@allocEmpId,allocated_by=@allocBy,allocated_date=@allocDate,expected_return_date=@expReturnDate,returned_date=@retDate,allocation_status=@allocStatus,remarks=@allocRem where allocation_id=@id and company_id=@company",
                        new { allocAssetId, allocEmpId, allocBy, allocDate, expReturnDate, retDate, allocStatus, allocRem, id, company });
                    break;

                case "asset-request":
                    var reqEmpId = GetValue(b, "employeeId", "employee_id") ?? cur.GetValueOrDefault("employee_id");
                    var reqCatId = GetValue(b, "categoryId", "category_id") ?? cur.GetValueOrDefault("category_id");
                    var reqAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var reqAppBy = GetValue(b, "approvedBy", "approved_by") ?? cur.GetValueOrDefault("approved_by");
                    var reqType = GetValue(b, "requestType", "request_type") ?? cur.GetValueOrDefault("request_type") ?? "NEW_ASSET";
                    var reqReason = GetValue(b, "reason") ?? cur.GetValueOrDefault("reason");
                    var reqStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "PENDING";
                    await _db.ExecuteAsync("update asset_requests set employee_id=@reqEmpId,category_id=@reqCatId,asset_id=@reqAssetId,approved_by=@reqAppBy,request_type=@reqType,reason=@reqReason,status=@reqStatus where request_id=@id and company_id=@company",
                        new { reqEmpId, reqCatId, reqAssetId, reqAppBy, reqType, reqReason, reqStatus, id, company });
                    break;

                case "asset-transfer":
                    var trAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var fromEmp = GetValue(b, "fromEmployeeId", "from_employee_id") ?? cur.GetValueOrDefault("from_employee_id");
                    var toEmp = GetValue(b, "toEmployeeId", "to_employee_id") ?? cur.GetValueOrDefault("to_employee_id");
                    var fromLoc = GetValue(b, "fromLocationId", "from_location_id") ?? cur.GetValueOrDefault("from_location_id");
                    var toLoc = GetValue(b, "toLocationId", "to_location_id") ?? cur.GetValueOrDefault("to_location_id");
                    var trAppBy = GetValue(b, "approvedBy", "approved_by") ?? cur.GetValueOrDefault("approved_by");
                    var trStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "PENDING";
                    var trReason = GetValue(b, "reason") ?? cur.GetValueOrDefault("reason");
                    await _db.ExecuteAsync("update asset_transfers set asset_id=@trAssetId,from_employee_id=@fromEmp,to_employee_id=@toEmp,from_location_id=@fromLoc,to_location_id=@toLoc,approved_by=@trAppBy,status=@trStatus,reason=@trReason where transfer_id=@id and company_id=@company",
                        new { trAssetId, fromEmp, toEmp, fromLoc, toLoc, trAppBy, trStatus, trReason, id, company });
                    break;

                case "asset-return":
                    var retAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var retEmpId = GetValue(b, "employeeId", "employee_id") ?? cur.GetValueOrDefault("employee_id");
                    var retAppBy = GetValue(b, "approvedBy", "approved_by") ?? cur.GetValueOrDefault("approved_by");
                    var cond = GetValue(b, "conditionStatus", "condition_status") ?? cur.GetValueOrDefault("condition_status") ?? "GOOD";
                    var retRem = GetValue(b, "remarks") ?? cur.GetValueOrDefault("remarks");
                    var retStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "PENDING";
                    var retAt = GetValue(b, "returnedAt", "returned_at") ?? cur.GetValueOrDefault("returned_at");
                    await _db.ExecuteAsync("update asset_returns set asset_id=@retAssetId,employee_id=@retEmpId,approved_by=@retAppBy,condition_status=@cond,remarks=@retRem,status=@retStatus,returned_at=@retAt where return_id=@id and company_id=@company",
                        new { retAssetId, retEmpId, retAppBy, cond, retRem, retStatus, retAt, id, company });
                    break;

                case "repair-history":
                    var repAssetId = GetValue(b, "assetId", "asset_id") ?? cur.GetValueOrDefault("asset_id");
                    var techId = GetValue(b, "technicianId", "technician_id") ?? cur.GetValueOrDefault("technician_id");
                    var repDesc = GetValue(b, "issueDescription", "issue_description") ?? cur.GetValueOrDefault("issue_description");
                    var repAction = GetValue(b, "repairAction", "repair_action") ?? cur.GetValueOrDefault("repair_action");
                    var cost = GetValue(b, "cost", "repairCost") ?? cur.GetValueOrDefault("cost") ?? 0.0;
                    var start = GetValue(b, "startedAt", "started_at") ?? cur.GetValueOrDefault("started_at");
                    var comp = GetValue(b, "completedAt", "completed_at") ?? cur.GetValueOrDefault("completed_at");
                    var repStatus = GetValue(b, "status") ?? cur.GetValueOrDefault("status") ?? "OPEN";
                    await _db.ExecuteAsync("update repair_history set asset_id=@repAssetId,technician_id=@techId,issue_description=@repDesc,repair_action=@repAction,cost=@cost,started_at=@start,completed_at=@comp,status=@repStatus where repair_id=@id and company_id=@company",
                        new { repAssetId, techId, repDesc, repAction, cost, start, comp, repStatus, id, company });
                    break;

                default:
                    throw new ArgumentException("Unsupported resource");
            }

            if (!merged.ContainsKey("assetId") && cur.ContainsKey("asset_id")) merged["assetId"] = cur["asset_id"];
            if (!merged.ContainsKey("employeeId") && cur.ContainsKey("employee_id")) merged["employeeId"] = cur["employee_id"];

            await LifecycleAsync(type, company, actor, merged);
            await AuditAsync(company, actor, type, "UPDATE", $"Updated {type} #{id}");
            await NotifyUpdateAsync(type, company, actor, cur, merged);
            return await OneAsync(type, company, actor, "COMPANY_ADMIN", id);
        }

        public async Task DeleteAsync(string type, long company, long actor, long id)
        {
            await EnsureOwnedAsync(type, company, id);
            await _db.ExecuteAsync($"update {Table(type)} set is_active=false where {Key(type)}=@id and company_id=@company", new { id, company });
            await AuditAsync(company, actor, type, "DELETE", $"Deactivated {type} #{id}");
        }

        public async Task<IDictionary<string, object>> ImportAssetsAsync(long company, long actor, IEnumerable<IDictionary<string, object>> rows)
        {
            int ok = 0;
            var bad = new List<IDictionary<string, object>>();
            int i = 0;
            foreach (var row in rows ?? Enumerable.Empty<IDictionary<string, object>>())
            {
                try
                {
                    await CreateAsync("asset", company, actor, row);
                    ok++;
                }
                catch (Exception e)
                {
                    bad.Add(new Dictionary<string, object>
                    {
                        { "row", i + 1 },
                        { "reason", e.Message }
                    });
                }
                i++;
            }
            return new Dictionary<string, object>
            {
                { "accepted", ok },
                { "rejected", bad },
                { "total", i }
            };
        }

        private string BaseQuery(string type)
        {
            return type switch
            {
                "asset" => "select a.*, c.category_name, v.vendor_name, l.location_name, po.order_number as purchase_order_number from assets a left join asset_categories c on c.category_id=a.category_id left join vendors v on v.vendor_id=a.vendor_id left join locations l on l.location_id=a.location_id left join purchase_orders po on po.purchase_order_id=a.purchase_order_id where a.company_id=@company and a.is_active=true",
                "category" => "select c.*, (select count(*) from assets a where a.category_id=c.category_id and a.company_id=c.company_id and a.is_active=true) as total_assets from asset_categories c where c.company_id=@company and c.is_active=true",
                "vendor" => "select v.*, (select count(*) from assets a where a.vendor_id=v.vendor_id and a.company_id=v.company_id and a.is_active=true) as total_assets from vendors v where v.company_id=@company and v.is_active=true",
                "purchase-order" => "select po.*, v.vendor_name from purchase_orders po left join vendors v on v.vendor_id=po.vendor_id where po.company_id=@company and po.is_active=true",
                "maintenance" => "select m.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email from maintenance m left join assets a on a.asset_id=m.asset_id left join users u on u.user_id=m.employee_id where m.company_id=@company and m.is_active=true",
                "asset-allocation" => "select aa.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, concat(ab.first_name, ' ', ab.last_name) as allocated_by_name from asset_allocations aa left join assets a on a.asset_id=aa.asset_id left join users u on u.user_id=aa.employee_id left join users ab on ab.user_id=aa.allocated_by where aa.company_id=@company and aa.is_active=true",
                "asset-request" => "select ar.*, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, c.category_name, a.asset_name, a.asset_tag, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_requests ar left join users u on u.user_id=ar.employee_id left join asset_categories c on c.category_id=ar.category_id left join assets a on a.asset_id=ar.asset_id left join users ab on ab.user_id=ar.approved_by where ar.company_id=@company and ar.is_active=true",
                "asset-transfer" => "select at.*, a.asset_name, a.asset_tag, concat(fe.first_name, ' ', fe.last_name) as from_employee_name, concat(te.first_name, ' ', te.last_name) as to_employee_name, fl.location_name as from_location_name, tl.location_name as to_location_name, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_transfers at left join assets a on a.asset_id=at.asset_id left join users fe on fe.user_id=at.from_employee_id left join users te on te.user_id=at.to_employee_id left join locations fl on fl.location_id=at.from_location_id left join locations tl on tl.location_id=at.to_location_id left join users ab on ab.user_id=at.approved_by where at.company_id=@company and at.is_active=true",
                "asset-return" => "select ar.*, a.asset_name, a.asset_tag, concat(u.first_name, ' ', u.last_name) as employee_name, u.email as employee_email, concat(ab.first_name, ' ', ab.last_name) as approved_by_name from asset_returns ar left join assets a on a.asset_id=ar.asset_id left join users u on u.user_id=ar.employee_id left join users ab on ab.user_id=ar.approved_by where ar.company_id=@company and ar.is_active=true",
                "repair-history" => "select rh.*, a.asset_name, a.asset_tag, concat(t.first_name, ' ', t.last_name) as technician_name from repair_history rh left join assets a on a.asset_id=rh.asset_id left join users t on t.user_id=rh.technician_id where rh.company_id=@company and rh.is_active=true",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private string SearchFilter(string type)
        {
            return type switch
            {
                "asset" => "a.asset_name like @search or a.asset_tag like @search or a.serial_number like @search or a.status like @search or c.category_name like @search or v.vendor_name like @search",
                "category" => "c.category_name like @search or c.description like @search",
                "vendor" => "v.vendor_name like @search or v.contact_person like @search or v.email like @search",
                "purchase-order" => "po.order_number like @search or po.status like @search or v.vendor_name like @search",
                "maintenance" => "a.asset_name like @search or m.issue_description like @search or m.status like @search or u.first_name like @search or u.last_name like @search",
                "asset-allocation" => "a.asset_name like @search or a.asset_tag like @search or aa.allocation_status like @search or u.first_name like @search or u.last_name like @search",
                "asset-request" => "c.category_name like @search or ar.request_type like @search or ar.reason like @search or ar.status like @search or u.first_name like @search or u.last_name like @search",
                "asset-transfer" => "a.asset_name like @search or at.status like @search or at.reason like @search or fe.first_name like @search or te.first_name like @search",
                "asset-return" => "a.asset_name like @search or ar.condition_status like @search or ar.status like @search or u.first_name like @search",
                "repair-history" => "a.asset_name like @search or rh.issue_description like @search or rh.repair_action like @search or rh.status like @search",
                _ => $"{QualifiedKey(type)} like @search"
            };
        }

        private string QualifiedKey(string type)
        {
            return type switch
            {
                "asset" => "a.asset_id",
                "category" => "c.category_id",
                "vendor" => "v.vendor_id",
                "purchase-order" => "po.purchase_order_id",
                "maintenance" => "m.maintenance_id",
                "asset-allocation" => "aa.allocation_id",
                "asset-request" => "ar.request_id",
                "asset-transfer" => "at.transfer_id",
                "asset-return" => "ar.return_id",
                "repair-history" => "rh.repair_id",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private string Table(string type)
        {
            return type switch
            {
                "asset" => "assets",
                "category" => "asset_categories",
                "vendor" => "vendors",
                "purchase-order" => "purchase_orders",
                "maintenance" => "maintenance",
                "asset-allocation" => "asset_allocations",
                "asset-request" => "asset_requests",
                "asset-transfer" => "asset_transfers",
                "asset-return" => "asset_returns",
                "repair-history" => "repair_history",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private string Key(string type)
        {
            return type switch
            {
                "asset" => "asset_id",
                "category" => "category_id",
                "vendor" => "vendor_id",
                "purchase-order" => "purchase_order_id",
                "maintenance" => "maintenance_id",
                "asset-allocation" => "allocation_id",
                "asset-request" => "request_id",
                "asset-transfer" => "transfer_id",
                "asset-return" => "return_id",
                "repair-history" => "repair_id",
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private async Task ValidateAsync(string type, long company, IDictionary<string, object> b)
        {
            var required = new Dictionary<string, string>();
            if (type == "asset")
            {
                required["assetName"] = "Asset name";
                required["assetTag"] = "Asset tag";
                required["serialNumber"] = "Serial number";
                required["categoryId"] = "Category";
                required["vendorId"] = "Vendor";
            }
            else if (type == "category") required["categoryName"] = "Category name";
            else if (type == "vendor") required["vendorName"] = "Vendor name";

            foreach (var req in required)
            {
                if (!b.TryGetValue(req.Key, out var val) || string.IsNullOrWhiteSpace(val?.ToString()))
                {
                    throw new ArgumentException($"{req.Value} is required");
                }
            }

            var refs = new Dictionary<string, string>();
            switch (type)
            {
                case "asset":
                    refs["categoryId"] = "asset_categories:category_id";
                    refs["vendorId"] = "vendors:vendor_id";
                    refs["locationId"] = "locations:location_id";
                    refs["purchaseOrderId"] = "purchase_orders:purchase_order_id";
                    refs["poId"] = "purchase_orders:purchase_order_id";
                    break;
                case "purchase-order":
                    refs["vendorId"] = "vendors:vendor_id";
                    break;
                case "maintenance":
                    refs["assetId"] = "assets:asset_id";
                    refs["employeeId"] = "users:user_id";
                    break;
                case "asset-allocation":
                    refs["assetId"] = "assets:asset_id";
                    refs["employeeId"] = "users:user_id";
                    refs["allocatedBy"] = "users:user_id";
                    break;
                case "asset-request":
                    refs["assetId"] = "assets:asset_id";
                    refs["categoryId"] = "asset_categories:category_id";
                    refs["employeeId"] = "users:user_id";
                    refs["approvedBy"] = "users:user_id";
                    break;
                case "asset-transfer":
                    refs["assetId"] = "assets:asset_id";
                    refs["fromEmployeeId"] = "users:user_id";
                    refs["toEmployeeId"] = "users:user_id";
                    refs["fromLocationId"] = "locations:location_id";
                    refs["toLocationId"] = "locations:location_id";
                    break;
                case "asset-return":
                    refs["assetId"] = "assets:asset_id";
                    refs["employeeId"] = "users:user_id";
                    break;
                case "repair-history":
                    refs["assetId"] = "assets:asset_id";
                    refs["technicianId"] = "users:user_id";
                    break;
            }

            foreach (var r in refs)
            {
                if (b.TryGetValue(r.Key, out var idVal) && idVal != null && !string.IsNullOrWhiteSpace(idVal.ToString()))
                {
                    var parts = r.Value.Split(':');
                    var count = await _db.QuerySingleOrDefaultAsync<int>($"select count(*) from {parts[0]} where {parts[1]}=@idVal and company_id=@company", new { idVal, company });
                    if (count == 0)
                    {
                        throw new ArgumentException($"Referenced {r.Key} does not belong to this company");
                    }
                }
            }
        }

        private async Task LifecycleAsync(string type, long company, long actor, IDictionary<string, object> b)
        {
            if (!b.TryGetValue("assetId", out var a) || a == null || string.IsNullOrWhiteSpace(a.ToString())) return;

            var s = (GetValue(b, "status")?.ToString() ?? "").ToUpper();

            if (type == "asset-allocation" && s != "CANCELLED")
            {
                await _db.ExecuteAsync("update assets set status='ASSIGNED' where asset_id=@a and company_id=@company", new { a, company });
            }
            else if (type == "asset-return" && s is "APPROVED" or "COMPLETED")
            {
                await _db.ExecuteAsync("update assets set status='AVAILABLE' where asset_id=@a and company_id=@company", new { a, company });
                var empId = GetValue(b, "employeeId");
                await _db.ExecuteAsync("update asset_allocations set allocation_status='RETURNED',returned_date=coalesce(returned_date,current_date()) where company_id=@company and asset_id=@a and employee_id=@empId and allocation_status='ACTIVE'", new { company, a, empId });
            }
            else if (type == "asset-transfer" && s == "APPROVED")
            {
                await _db.ExecuteAsync("update assets set status='ASSIGNED' where asset_id=@a and company_id=@company", new { a, company });
                await _db.ExecuteAsync("update asset_allocations set allocation_status='TRANSFERRED',returned_date=coalesce(returned_date,current_date()) where company_id=@company and asset_id=@a and allocation_status='ACTIVE'", new { company, a });
                var toEmp = GetValue(b, "toEmployeeId");
                if (toEmp != null)
                {
                    await _db.ExecuteAsync("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,allocation_status,remarks) values(@company,@a,@toEmp,@actor,current_date(),'ACTIVE','Transferred')", new { company, a, toEmp, actor });
                }
            }
            else if (type == "asset-request" && s == "APPROVED")
            {
                await _db.ExecuteAsync("update assets set status='ASSIGNED' where asset_id=@a and company_id=@company", new { a, company });
                var activeCount = await _db.QuerySingleOrDefaultAsync<int>("select count(*) from asset_allocations where company_id=@company and asset_id=@a and allocation_status='ACTIVE'", new { company, a });
                if (activeCount == 0)
                {
                    var empId = GetValue(b, "employeeId");
                    var appBy = GetValue(b, "approvedBy") ?? actor;
                    await _db.ExecuteAsync("insert into asset_allocations(company_id,asset_id,employee_id,allocated_by,allocated_date,allocation_status,remarks) values(@company,@a,@empId,@appBy,current_date(),'ACTIVE','Approved request')", new { company, a, empId, appBy });
                }
            }
            else if (type == "maintenance")
            {
                var newStatus = s is "COMPLETED" or "CANCELLED" ? "AVAILABLE" : "UNDER_REPAIR";
                await _db.ExecuteAsync("update assets set status=@newStatus where asset_id=@a and company_id=@company", new { newStatus, a, company });
            }
        }

        private async Task NotifyCreationAsync(string type, long company, long actor, IDictionary<string, object> b)
        {
            if (type != "asset-request")
            {
                object? targetUser = type switch
                {
                    "asset-allocation" or "maintenance" => GetValue(b, "employeeId"),
                    "asset-transfer" => GetValue(b, "toEmployeeId"),
                    _ => null
                };

                if (targetUser != null)
                {
                    try
                    {
                        await _db.ExecuteAsync("insert into notifications(company_id,user_id,title,message) values(@company,@targetUser,@title,@msg)",
                            new { company, targetUser, title = "AssetFlow update", msg = $"You have been assigned to a {type.Replace('-', ' ')}." });
                    }
                    catch { /* ignored */ }
                }
                return;
            }

            try
            {
                string employeeName = "An employee";
                try
                {
                    var empRow = await _db.QuerySingleOrDefaultAsync<dynamic>("select concat(first_name,' ',last_name) as n from users where user_id=@actor and company_id=@company", new { actor, company });
                    if (empRow?.n != null) employeeName = empRow.n.ToString();
                }
                catch { /* ignored */ }

                var reqType = GetValue(b, "requestType", "request_type")?.ToString() ?? "NEW ASSET";
                var reason = GetValue(b, "reason")?.ToString() ?? "No reason provided";
                var msg = $"{employeeName} submitted an asset request — Type: {reqType.Replace('_', ' ')}. Reason: {(reason.Length > 120 ? reason[..120] + "…" : reason)}";

                var admins = await _db.QueryAsync<dynamic>("select u.user_id from users u join roles r on r.role_id=u.role_id where u.company_id=@company and r.role_name='COMPANY_ADMIN' and u.is_active=true", new { company });
                foreach (var admin in admins)
                {
                    await _db.ExecuteAsync("insert into notifications(company_id,user_id,title,message) values(@company,@adminId,@title,@msg)",
                        new { company, adminId = admin.user_id, title = "New Asset Request", msg });
                }
            }
            catch { /* ignored */ }
        }

        private async Task NotifyUpdateAsync(string type, long company, long actor, IDictionary<string, object> cur, IDictionary<string, object> merged)
        {
            if (type == "asset-request")
            {
                var prevStatus = (cur.GetValueOrDefault("status")?.ToString() ?? "PENDING").ToUpper();
                var newStatus = (merged.GetValueOrDefault("status")?.ToString() ?? "PENDING").ToUpper();
                var empId = merged.GetValueOrDefault("employeeId") ?? cur.GetValueOrDefault("employee_id");

                if (empId != null && prevStatus != newStatus && newStatus is "APPROVED" or "REJECTED" or "FULFILLED")
                {
                    var title = $"Asset Request {newStatus[0]}{newStatus[1..].ToLower()}";
                    var body = $"Your asset request has been {newStatus.ToLower()} by your administrator.";
                    if (newStatus == "APPROVED") body = "Great news! Your asset request has been approved by your administrator.";
                    if (newStatus == "FULFILLED") body = "Your asset request has been fulfilled and the asset has been allocated to you.";

                    try
                    {
                        await _db.ExecuteAsync("insert into notifications(company_id,user_id,title,message) values(@company,@empId,@title,@body)",
                            new { company, empId, title, body });
                    }
                    catch { /* ignored */ }
                }
                return;
            }

            object? u = type switch
            {
                "asset-allocation" or "asset-return" or "maintenance" => merged.GetValueOrDefault("employeeId"),
                "asset-transfer" => merged.GetValueOrDefault("toEmployeeId"),
                _ => null
            };

            if (u != null)
            {
                try
                {
                    await _db.ExecuteAsync("insert into notifications(company_id,user_id,title,message) values(@company,@u,@title,@msg)",
                        new { company, u, title = "AssetFlow update", msg = $"Your {type.Replace('-', ' ')} status has been updated." });
                }
                catch { /* ignored */ }
            }
        }

        private async Task AuditAsync(long company, long user, string module, string action, string text)
        {
            try
            {
                await _db.ExecuteAsync("insert into audit_logs(company_id,user_id,module,action,description) values(@company,@user,@module,@action,@text)",
                    new { company, user, module, action, text });
            }
            catch { /* ignored */ }
        }

        private async Task EnsureOwnedAsync(string type, long company, long id)
        {
            var count = await _db.QuerySingleOrDefaultAsync<int>($"select count(*) from {Table(type)} where {Key(type)}=@id and company_id=@company", new { id, company });
            if (count == 0) throw new KeyNotFoundException("Resource not found");
        }

        private object? GetValue(IDictionary<string, object> dict, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (dict.TryGetValue(key, out var val) && val != null && !string.IsNullOrWhiteSpace(val.ToString()))
                {
                    return val;
                }
            }
            return null;
        }
    }
}
