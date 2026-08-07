using System.Text.Json;
using AssetService.Data;
using AssetService.DTOs;
using AssetService.Models;
using Microsoft.EntityFrameworkCore;

namespace AssetService.Services
{
    public class AssetDataService : IAssetDataService
    {
        private readonly AssetDbContext _db;

        public AssetDataService(AssetDbContext db)
        {
            _db = db;
        }

        private async Task EnsureOwnedAsync(string type, long id, long companyId)
        {
            bool exists = type switch
            {
                "asset" => await _db.Assets.AnyAsync(a => a.AssetId == id && a.CompanyId == companyId),
                "category" => await _db.AssetCategories.AnyAsync(c => c.CategoryId == id && c.CompanyId == companyId),
                "vendor" => await _db.Vendors.AnyAsync(v => v.VendorId == id && v.CompanyId == companyId),
                "purchase-order" => await _db.PurchaseOrders.AnyAsync(p => p.PurchaseOrderId == id && p.CompanyId == companyId),
                "maintenance" => await _db.ServiceTickets.AnyAsync(t => t.TicketId == id && t.CompanyId == companyId),
                "asset-allocation" => await _db.AssetAllocations.AnyAsync(a => a.AllocationId == id && a.CompanyId == companyId),
                "asset-request" => await _db.AssetRequests.AnyAsync(r => r.RequestId == id && r.CompanyId == companyId),
                "asset-transfer" => await _db.AssetTransfers.AnyAsync(t => t.TransferId == id && t.CompanyId == companyId),
                "asset-return" => await _db.AssetReturns.AnyAsync(r => r.ReturnId == id && r.CompanyId == companyId),
                "repair-history" => await _db.RepairHistories.AnyAsync(h => h.RepairId == id && h.CompanyId == companyId),
                _ => throw new ArgumentException("Unsupported resource")
            };

            if (!exists)
            {
                throw new KeyNotFoundException("Resource not found");
            }
        }

        public async Task EnsureEmployeeAssetAsync(long companyId, long userId, long assetId)
        {
            if (assetId == 0) throw new ArgumentException("An assigned asset is required");
            var exists = await _db.AssetAllocations.AnyAsync(a => a.CompanyId == companyId && a.AssetId == assetId && a.EmployeeId == userId && a.AllocationStatus == "ACTIVE");
            if (!exists) throw new UnauthorizedAccessException("You are not allowed to access this resource");
        }

        private async Task AuditAsync(long companyId, long userId, string module, string action, string description)
        {
            _db.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                UserId = userId,
                Module = module,
                Action = action,
                Description = description,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        private async Task NotifyAsync(long companyId, long? userId, string title, string message)
        {
            if (userId.HasValue)
            {
                _db.Notifications.Add(new Notification
                {
                    CompanyId = companyId,
                    UserId = userId.Value,
                    Title = title,
                    Message = message,
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
            }
        }

        public async Task<object> ListAsync(string type, long companyId, long userId, string role, string? search, int page, int size)
        {
            page = Math.Max(0, page);
            size = Math.Clamp(size, 1, 100);

            return type switch
            {
                "asset" => await GetAssetListAsync(companyId, userId, role, search, page, size),
                "category" => await GetCategoryListAsync(companyId, search, page, size),
                "vendor" => await GetVendorListAsync(companyId, search, page, size),
                "purchase-order" => await GetPurchaseOrderListAsync(companyId, search, page, size),
                "maintenance" => await GetMaintenanceListAsync(companyId, userId, role, search, page, size),
                "asset-allocation" => await GetAssetAllocationListAsync(companyId, search, page, size),
                "asset-request" => await GetAssetRequestListAsync(companyId, userId, role, search, page, size),
                "asset-transfer" => await GetAssetTransferListAsync(companyId, search, page, size),
                "asset-return" => await GetAssetReturnListAsync(companyId, userId, role, search, page, size),
                "repair-history" => await GetRepairHistoryListAsync(companyId, search, page, size),
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        private async Task<object> GetAssetListAsync(long companyId, long userId, string role, string? search, int page, int size)
        {
            var q = _db.Assets.Where(a => a.CompanyId == companyId);
            if (role == "EMPLOYEE")
            {
                q = q.Where(a => _db.AssetAllocations.Any(al => al.CompanyId == companyId && al.EmployeeId == userId && al.AllocationStatus == "ACTIVE" && al.AssetId == a.AssetId));
            }
            if (!string.IsNullOrEmpty(search))
                q = q.Where(a => a.AssetName.Contains(search) || a.AssetTag.Contains(search) || a.SerialNumber.Contains(search) || a.Status.Contains(search));

            return await q.OrderByDescending(a => a.AssetId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetCategoryListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.AssetCategories.Where(c => c.CompanyId == companyId);
            if (!string.IsNullOrEmpty(search)) q = q.Where(c => c.CategoryName.Contains(search) || c.Description.Contains(search));
            return await q.OrderByDescending(c => c.CategoryId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetVendorListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.Vendors.Where(v => v.CompanyId == companyId);
            if (!string.IsNullOrEmpty(search)) q = q.Where(v => v.VendorName.Contains(search) || v.ContactPerson.Contains(search));
            return await q.OrderByDescending(v => v.VendorId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetPurchaseOrderListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.PurchaseOrders.Where(p => p.CompanyId == companyId);
            if (!string.IsNullOrEmpty(search)) q = q.Where(p => p.OrderNumber.Contains(search) || p.Status.Contains(search));
            return await q.OrderByDescending(p => p.PurchaseOrderId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetMaintenanceListAsync(long companyId, long userId, string role, string? search, int page, int size)
        {
            var q = _db.ServiceTickets.Where(t => t.CompanyId == companyId);
            if (role == "EMPLOYEE") q = q.Where(t => t.EmployeeId == userId);
            return await q.OrderByDescending(t => t.TicketId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetAssetAllocationListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.AssetAllocations.Where(a => a.CompanyId == companyId);
            return await q.OrderByDescending(a => a.AllocationId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetAssetRequestListAsync(long companyId, long userId, string role, string? search, int page, int size)
        {
            var q = _db.AssetRequests.Where(r => r.CompanyId == companyId);
            if (role == "EMPLOYEE") q = q.Where(r => r.EmployeeId == userId);
            return await q.OrderByDescending(r => r.RequestId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetAssetTransferListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.AssetTransfers.Where(t => t.CompanyId == companyId);
            return await q.OrderByDescending(t => t.TransferId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetAssetReturnListAsync(long companyId, long userId, string role, string? search, int page, int size)
        {
            var q = _db.AssetReturns.Where(r => r.CompanyId == companyId);
            if (role == "EMPLOYEE") q = q.Where(r => r.EmployeeId == userId);
            return await q.OrderByDescending(r => r.ReturnId).Skip(page * size).Take(size).ToListAsync();
        }

        private async Task<object> GetRepairHistoryListAsync(long companyId, string? search, int page, int size)
        {
            var q = _db.RepairHistories.Where(h => h.CompanyId == companyId);
            return await q.OrderByDescending(h => h.RepairId).Skip(page * size).Take(size).ToListAsync();
        }

        public async Task<object> OneAsync(string type, long companyId, long userId, string role, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

            if (role == "EMPLOYEE")
            {
                if (type == "asset")
                {
                    await EnsureEmployeeAssetAsync(companyId, userId, id);
                }
                else if (type != "asset-request" && type != "asset-return" && type != "maintenance")
                {
                    throw new UnauthorizedAccessException("You are not allowed to access this resource");
                }
                else
                {
                    bool owned = type switch
                    {
                        "asset-request" => await _db.AssetRequests.AnyAsync(r => r.RequestId == id && r.CompanyId == companyId && r.EmployeeId == userId),
                        "asset-return" => await _db.AssetReturns.AnyAsync(r => r.ReturnId == id && r.CompanyId == companyId && r.EmployeeId == userId),
                        "maintenance" => await _db.ServiceTickets.AnyAsync(t => t.TicketId == id && t.CompanyId == companyId && t.EmployeeId == userId),
                        _ => false
                    };
                    if (!owned) throw new UnauthorizedAccessException("You are not allowed to access this resource");
                }
            }

            return type switch
            {
                "asset" => await _db.Assets.FindAsync(id) ?? throw new KeyNotFoundException(),
                "category" => await _db.AssetCategories.FindAsync(id) ?? throw new KeyNotFoundException(),
                "vendor" => await _db.Vendors.FindAsync(id) ?? throw new KeyNotFoundException(),
                "purchase-order" => await _db.PurchaseOrders.FindAsync(id) ?? throw new KeyNotFoundException(),
                "maintenance" => await _db.ServiceTickets.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-allocation" => await _db.AssetAllocations.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-request" => await _db.AssetRequests.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-transfer" => await _db.AssetTransfers.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-return" => await _db.AssetReturns.FindAsync(id) ?? throw new KeyNotFoundException(),
                "repair-history" => await _db.RepairHistories.FindAsync(id) ?? throw new KeyNotFoundException(),
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        public async Task<object> CreateAsync(string type, long companyId, long userId, JsonElement body)
        {
            // Simple deserialization based on Dictionary for properties
            var dict = body.Deserialize<Dictionary<string, object>>();
            if (dict == null) throw new ArgumentException("Invalid body");

            long? assetIdForLifecycle = null;
            long? employeeIdForNotification = null;

            switch (type)
            {
                case "asset":
                    var asset = new Asset
                    {
                        CompanyId = companyId,
                        CategoryId = GetLong(dict, "categoryId"),
                        VendorId = GetLong(dict, "vendorId"),
                        LocationId = GetLongNullable(dict, "locationId"),
                        PurchaseOrderId = GetLongNullable(dict, "purchaseOrderId"),
                        AssetName = GetString(dict, "assetName"),
                        AssetTag = GetString(dict, "assetTag"),
                        SerialNumber = GetString(dict, "serialNumber"),
                        Manufacturer = GetString(dict, "manufacturer"),
                        Model = GetString(dict, "model"),
                        PurchaseDate = GetDateTimeNullable(dict, "purchaseDate"),
                        PurchaseCost = GetDecimalNullable(dict, "purchaseCost"),
                        WarrantyExpiry = GetDateTimeNullable(dict, "warrantyExpiry"),
                        Status = GetString(dict, "status") ?? "AVAILABLE",
                        Remarks = GetString(dict, "remarks"),
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.Assets.Add(asset);
                    break;
                case "category":
                    _db.AssetCategories.Add(new AssetCategory
                    {
                        CompanyId = companyId, CategoryName = GetString(dict, "categoryName"), Description = GetString(dict, "description"), CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "vendor":
                    _db.Vendors.Add(new Vendor
                    {
                        CompanyId = companyId, VendorName = GetString(dict, "vendorName"), ContactPerson = GetString(dict, "contactPerson"),
                        Email = GetString(dict, "email"), Phone = GetString(dict, "phone"), Address = GetString(dict, "address"), CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "purchase-order":
                    _db.PurchaseOrders.Add(new PurchaseOrder
                    {
                        CompanyId = companyId, VendorId = GetLong(dict, "vendorId"), OrderNumber = GetString(dict, "orderNumber"),
                        OrderDate = GetDateTimeNullable(dict, "orderDate"), ExpectedDeliveryDate = GetDateTimeNullable(dict, "expectedDeliveryDate"),
                        TotalAmount = GetDecimalNullable(dict, "totalAmount"), Status = GetString(dict, "status") ?? "DRAFT", Remarks = GetString(dict, "remarks"), CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "maintenance":
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    employeeIdForNotification = GetLong(dict, "employeeId");
                    _db.ServiceTickets.Add(new ServiceTicket
                    {
                        CompanyId = companyId, AssetId = assetIdForLifecycle.Value, EmployeeId = employeeIdForNotification.Value,
                        IssueDescription = GetString(dict, "issueDescription"), Priority = GetString(dict, "priority") ?? "MEDIUM",
                        Status = GetString(dict, "status") ?? "OPEN", CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-allocation":
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    employeeIdForNotification = GetLong(dict, "employeeId");
                    _db.AssetAllocations.Add(new AssetAllocation
                    {
                        CompanyId = companyId, AssetId = assetIdForLifecycle.Value, EmployeeId = employeeIdForNotification.Value,
                        AllocatedBy = GetLong(dict, "allocatedBy"), AllocatedDate = GetDateTimeNullable(dict, "allocatedDate") ?? DateTime.UtcNow.Date,
                        ExpectedReturnDate = GetDateTimeNullable(dict, "expectedReturnDate"), AllocationStatus = GetString(dict, "allocationStatus") ?? "ACTIVE",
                        Remarks = GetString(dict, "remarks"), CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-request":
                    assetIdForLifecycle = GetLongNullable(dict, "assetId");
                    employeeIdForNotification = GetLong(dict, "employeeId");
                    _db.AssetRequests.Add(new AssetRequest
                    {
                        CompanyId = companyId, EmployeeId = employeeIdForNotification.Value, CategoryId = GetLongNullable(dict, "categoryId"),
                        AssetId = assetIdForLifecycle, ApprovedBy = GetLongNullable(dict, "approvedBy"), RequestType = GetString(dict, "requestType") ?? "NEW_ASSET",
                        Reason = GetString(dict, "reason"), Status = GetString(dict, "status") ?? "PENDING", RequestedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-transfer":
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    employeeIdForNotification = GetLongNullable(dict, "toEmployeeId");
                    _db.AssetTransfers.Add(new AssetTransfer
                    {
                        CompanyId = companyId, AssetId = assetIdForLifecycle.Value, FromEmployeeId = GetLongNullable(dict, "fromEmployeeId"),
                        ToEmployeeId = employeeIdForNotification, FromLocationId = GetLongNullable(dict, "fromLocationId"),
                        ToLocationId = GetLongNullable(dict, "toLocationId"), RequestedBy = GetLongNullable(dict, "requestedBy"),
                        Status = GetString(dict, "status") ?? "PENDING", Reason = GetString(dict, "reason"), CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-return":
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    employeeIdForNotification = GetLong(dict, "employeeId");
                    _db.AssetReturns.Add(new AssetReturn
                    {
                        CompanyId = companyId, AssetId = assetIdForLifecycle.Value, EmployeeId = employeeIdForNotification.Value,
                        RequestedBy = GetLongNullable(dict, "requestedBy"), ConditionStatus = GetString(dict, "conditionStatus"),
                        Remarks = GetString(dict, "remarks"), Status = GetString(dict, "status") ?? "PENDING", CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "repair-history":
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    _db.RepairHistories.Add(new RepairHistory
                    {
                        CompanyId = companyId, AssetId = assetIdForLifecycle.Value, TechnicianId = GetLongNullable(dict, "technicianId"),
                        IssueDescription = GetString(dict, "issueDescription"), RepairAction = GetString(dict, "repairAction"),
                        Cost = GetDecimalNullable(dict, "cost"), StartedAt = GetDateTimeNullable(dict, "startedAt"),
                        CompletedAt = GetDateTimeNullable(dict, "completedAt"), Status = GetString(dict, "status") ?? "OPEN", CreatedAt = DateTime.UtcNow
                    });
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await _db.SaveChangesAsync();
            await HandleLifecycleAsync(type, companyId, userId, dict, assetIdForLifecycle);
            await AuditAsync(companyId, userId, type, "CREATE", $"Created {type}");
            await NotifyAsync(companyId, employeeIdForNotification, "AssetFlow update", $"Your {type.Replace("-", " ")} has been created.");

            return body;
        }

        public async Task<object> ImportAssetsAsync(long companyId, long userId, List<JsonElement> rows)
        {
            int ok = 0;
            var bad = new List<object>();

            for (int i = 0; i < (rows?.Count ?? 0); i++)
            {
                try
                {
                    await CreateAsync("asset", companyId, userId, rows![i]);
                    ok++;
                }
                catch (Exception e)
                {
                    bad.Add(new { row = i + 1, reason = e.Message });
                }
            }

            return new { accepted = ok, rejected = bad, total = rows?.Count ?? 0 };
        }

        public async Task<object> UpdateAsync(string type, long companyId, long userId, long id, JsonElement body)
        {
            await EnsureOwnedAsync(type, id, companyId);
            var dict = body.Deserialize<Dictionary<string, object>>();
            if (dict == null) throw new ArgumentException("Invalid body");

            long? assetIdForLifecycle = null;
            long? employeeIdForNotification = null;

            switch (type)
            {
                case "asset":
                    var asset = await _db.Assets.FindAsync(id);
                    asset!.CategoryId = GetLong(dict, "categoryId"); asset.VendorId = GetLong(dict, "vendorId"); asset.LocationId = GetLongNullable(dict, "locationId");
                    asset.PurchaseOrderId = GetLongNullable(dict, "purchaseOrderId"); asset.AssetName = GetString(dict, "assetName");
                    asset.AssetTag = GetString(dict, "assetTag"); asset.SerialNumber = GetString(dict, "serialNumber"); asset.Manufacturer = GetString(dict, "manufacturer");
                    asset.Model = GetString(dict, "model"); asset.PurchaseDate = GetDateTimeNullable(dict, "purchaseDate"); asset.PurchaseCost = GetDecimalNullable(dict, "purchaseCost");
                    asset.WarrantyExpiry = GetDateTimeNullable(dict, "warrantyExpiry"); asset.Status = GetString(dict, "status") ?? "AVAILABLE"; asset.Remarks = GetString(dict, "remarks");
                    asset.UpdatedAt = DateTime.UtcNow;
                    break;
                case "category":
                    var category = await _db.AssetCategories.FindAsync(id);
                    category!.CategoryName = GetString(dict, "categoryName"); category.Description = GetString(dict, "description");
                    category.IsActive = GetBool(dict, "isActive", true); category.UpdatedAt = DateTime.UtcNow;
                    break;
                case "vendor":
                    var vendor = await _db.Vendors.FindAsync(id);
                    vendor!.VendorName = GetString(dict, "vendorName"); vendor.ContactPerson = GetString(dict, "contactPerson"); vendor.Email = GetString(dict, "email");
                    vendor.Phone = GetString(dict, "phone"); vendor.Address = GetString(dict, "address"); vendor.IsActive = GetBool(dict, "isActive", true);
                    vendor.UpdatedAt = DateTime.UtcNow;
                    break;
                case "purchase-order":
                    var po = await _db.PurchaseOrders.FindAsync(id);
                    po!.VendorId = GetLong(dict, "vendorId"); po.OrderNumber = GetString(dict, "orderNumber"); po.OrderDate = GetDateTimeNullable(dict, "orderDate");
                    po.ExpectedDeliveryDate = GetDateTimeNullable(dict, "expectedDeliveryDate"); po.TotalAmount = GetDecimalNullable(dict, "totalAmount");
                    po.Status = GetString(dict, "status") ?? "DRAFT"; po.Remarks = GetString(dict, "remarks"); po.UpdatedAt = DateTime.UtcNow;
                    break;
                case "maintenance":
                    var ticket = await _db.ServiceTickets.FindAsync(id);
                    assetIdForLifecycle = GetLong(dict, "assetId"); employeeIdForNotification = GetLong(dict, "employeeId");
                    ticket!.AssetId = assetIdForLifecycle.Value; ticket.EmployeeId = employeeIdForNotification.Value; ticket.IssueDescription = GetString(dict, "issueDescription");
                    ticket.Priority = GetString(dict, "priority") ?? "MEDIUM"; ticket.Status = GetString(dict, "status") ?? "OPEN"; ticket.ResolvedAt = GetDateTimeNullable(dict, "resolvedAt");
                    break;
                case "asset-allocation":
                    var alloc = await _db.AssetAllocations.FindAsync(id);
                    assetIdForLifecycle = GetLong(dict, "assetId"); employeeIdForNotification = GetLong(dict, "employeeId");
                    alloc!.AssetId = assetIdForLifecycle.Value; alloc.EmployeeId = employeeIdForNotification.Value; alloc.AllocatedBy = GetLong(dict, "allocatedBy");
                    alloc.AllocatedDate = GetDateTimeNullable(dict, "allocatedDate") ?? DateTime.UtcNow.Date; alloc.ExpectedReturnDate = GetDateTimeNullable(dict, "expectedReturnDate");
                    alloc.ReturnedDate = GetDateTimeNullable(dict, "returnedDate"); alloc.AllocationStatus = GetString(dict, "allocationStatus") ?? "ACTIVE"; alloc.Remarks = GetString(dict, "remarks");
                    break;
                case "asset-request":
                    var req = await _db.AssetRequests.FindAsync(id);
                    assetIdForLifecycle = GetLongNullable(dict, "assetId"); employeeIdForNotification = GetLong(dict, "employeeId");
                    req!.EmployeeId = employeeIdForNotification.Value; req.CategoryId = GetLongNullable(dict, "categoryId"); req.AssetId = assetIdForLifecycle;
                    req.ApprovedBy = GetLongNullable(dict, "approvedBy"); req.RequestType = GetString(dict, "requestType"); req.Reason = GetString(dict, "reason");
                    req.Status = GetString(dict, "status") ?? "PENDING"; req.UpdatedAt = DateTime.UtcNow;
                    break;
                case "asset-transfer":
                    var transfer = await _db.AssetTransfers.FindAsync(id);
                    assetIdForLifecycle = GetLong(dict, "assetId"); employeeIdForNotification = GetLongNullable(dict, "toEmployeeId");
                    transfer!.AssetId = assetIdForLifecycle.Value; transfer.FromEmployeeId = GetLongNullable(dict, "fromEmployeeId");
                    transfer.ToEmployeeId = employeeIdForNotification; transfer.FromLocationId = GetLongNullable(dict, "fromLocationId");
                    transfer.ToLocationId = GetLongNullable(dict, "toLocationId"); transfer.ApprovedBy = GetLongNullable(dict, "approvedBy");
                    transfer.Status = GetString(dict, "status") ?? "PENDING"; transfer.Reason = GetString(dict, "reason"); transfer.UpdatedAt = DateTime.UtcNow;
                    break;
                case "asset-return":
                    var ret = await _db.AssetReturns.FindAsync(id);
                    assetIdForLifecycle = GetLong(dict, "assetId"); employeeIdForNotification = GetLong(dict, "employeeId");
                    ret!.AssetId = assetIdForLifecycle.Value; ret.EmployeeId = employeeIdForNotification.Value; ret.ApprovedBy = GetLongNullable(dict, "approvedBy");
                    ret.ConditionStatus = GetString(dict, "conditionStatus"); ret.Remarks = GetString(dict, "remarks"); ret.Status = GetString(dict, "status") ?? "PENDING";
                    ret.ReturnedAt = GetDateTimeNullable(dict, "returnedAt");
                    break;
                case "repair-history":
                    var rep = await _db.RepairHistories.FindAsync(id);
                    assetIdForLifecycle = GetLong(dict, "assetId");
                    rep!.AssetId = assetIdForLifecycle.Value; rep.TechnicianId = GetLongNullable(dict, "technicianId"); rep.IssueDescription = GetString(dict, "issueDescription");
                    rep.RepairAction = GetString(dict, "repairAction"); rep.Cost = GetDecimalNullable(dict, "cost"); rep.StartedAt = GetDateTimeNullable(dict, "startedAt");
                    rep.CompletedAt = GetDateTimeNullable(dict, "completedAt"); rep.Status = GetString(dict, "status") ?? "OPEN"; rep.UpdatedAt = DateTime.UtcNow;
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await _db.SaveChangesAsync();
            await HandleLifecycleAsync(type, companyId, userId, dict, assetIdForLifecycle);
            await AuditAsync(companyId, userId, type, "UPDATE", $"Updated {type} #{id}");
            await NotifyAsync(companyId, employeeIdForNotification, "AssetFlow update", $"Your {type.Replace("-", " ")} has been updated.");

            return await OneAsync(type, companyId, userId, "COMPANY_ADMIN", id);
        }

        private async Task HandleLifecycleAsync(string type, long companyId, long userId, Dictionary<string, object> dict, long? assetId)
        {
            if (assetId == null) return;
            var status = GetString(dict, "status")?.ToUpper() ?? "";

            if (type == "asset-allocation" && status != "CANCELLED")
            {
                var asset = await _db.Assets.FindAsync(assetId);
                if (asset != null) asset.Status = "ASSIGNED";
            }
            else if (type == "asset-return" && (status == "APPROVED" || status == "COMPLETED"))
            {
                var asset = await _db.Assets.FindAsync(assetId);
                if (asset != null) asset.Status = "AVAILABLE";

                var empId = GetLong(dict, "employeeId");
                var alloc = await _db.AssetAllocations.FirstOrDefaultAsync(a => a.CompanyId == companyId && a.AssetId == assetId && a.EmployeeId == empId && a.AllocationStatus == "ACTIVE");
                if (alloc != null)
                {
                    alloc.AllocationStatus = "RETURNED";
                    alloc.ReturnedDate = alloc.ReturnedDate ?? DateTime.UtcNow.Date;
                }
            }
            else if (type == "asset-transfer" && status == "APPROVED")
            {
                var asset = await _db.Assets.FindAsync(assetId);
                if (asset != null) asset.Status = "ASSIGNED";

                var alloc = await _db.AssetAllocations.FirstOrDefaultAsync(a => a.CompanyId == companyId && a.AssetId == assetId && a.AllocationStatus == "ACTIVE");
                if (alloc != null)
                {
                    alloc.AllocationStatus = "TRANSFERRED";
                    alloc.ReturnedDate = alloc.ReturnedDate ?? DateTime.UtcNow.Date;
                }

                var toEmployee = GetLongNullable(dict, "toEmployeeId");
                if (toEmployee.HasValue)
                {
                    _db.AssetAllocations.Add(new AssetAllocation
                    {
                        CompanyId = companyId,
                        AssetId = assetId.Value,
                        EmployeeId = toEmployee.Value,
                        AllocatedBy = userId,
                        AllocatedDate = DateTime.UtcNow.Date,
                        AllocationStatus = "ACTIVE",
                        Remarks = "Transferred",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (type == "asset-request" && status == "APPROVED")
            {
                var asset = await _db.Assets.FindAsync(assetId);
                if (asset != null) asset.Status = "ASSIGNED";

                var hasActive = await _db.AssetAllocations.AnyAsync(a => a.CompanyId == companyId && a.AssetId == assetId && a.AllocationStatus == "ACTIVE");
                if (!hasActive)
                {
                    _db.AssetAllocations.Add(new AssetAllocation
                    {
                        CompanyId = companyId,
                        AssetId = assetId.Value,
                        EmployeeId = GetLong(dict, "employeeId"),
                        AllocatedBy = GetLongNullable(dict, "approvedBy") ?? userId,
                        AllocatedDate = DateTime.UtcNow.Date,
                        AllocationStatus = "ACTIVE",
                        Remarks = "Approved request",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (type == "maintenance")
            {
                var asset = await _db.Assets.FindAsync(assetId);
                if (asset != null)
                {
                    asset.Status = status == "COMPLETED" || status == "CANCELLED" ? "AVAILABLE" : "UNDER_REPAIR";
                }
            }

            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(string type, long companyId, long userId, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);
            // Implement delete logic based on type exactly as before...

            if (type == "purchase-order")
            {
                var po = await _db.PurchaseOrders.FindAsync(id);
                if (po != null) _db.PurchaseOrders.Remove(po);
            }
            else
            {
                switch (type)
                {
                    case "asset":
                        var asset = await _db.Assets.FindAsync(id);
                        if (asset != null) _db.Assets.Remove(asset);
                        break;
                    case "category":
                        var cat = await _db.AssetCategories.FindAsync(id);
                        if (cat != null) _db.AssetCategories.Remove(cat);
                        break;
                    case "vendor":
                        var ven = await _db.Vendors.FindAsync(id);
                        if (ven != null) _db.Vendors.Remove(ven);
                        break;
                    case "maintenance":
                        var ticket = await _db.ServiceTickets.FindAsync(id);
                        if (ticket != null) _db.ServiceTickets.Remove(ticket);
                        break;
                    case "asset-allocation":
                        var alloc = await _db.AssetAllocations.FindAsync(id);
                        if (alloc != null) _db.AssetAllocations.Remove(alloc);
                        break;
                    case "asset-request":
                        var req = await _db.AssetRequests.FindAsync(id);
                        if (req != null) _db.AssetRequests.Remove(req);
                        break;
                    case "asset-transfer":
                        var tr = await _db.AssetTransfers.FindAsync(id);
                        if (tr != null) _db.AssetTransfers.Remove(tr);
                        break;
                    case "asset-return":
                        var ar = await _db.AssetReturns.FindAsync(id);
                        if (ar != null) _db.AssetReturns.Remove(ar);
                        break;
                    case "repair-history":
                        var rh = await _db.RepairHistories.FindAsync(id);
                        if (rh != null) _db.RepairHistories.Remove(rh);
                        break;
                }
            }

            await _db.SaveChangesAsync();
            await AuditAsync(companyId, userId, type, "DELETE", $"Deleted {type} #{id}");
        }

        private long GetLong(Dictionary<string, object> dict, string key) =>
            dict.TryGetValue(key, out var val) && val != null ? long.Parse(val.ToString()!) : 0;

        private long? GetLongNullable(Dictionary<string, object> dict, string key) =>
            dict.TryGetValue(key, out var val) && val != null && !string.IsNullOrWhiteSpace(val.ToString()) ? long.Parse(val.ToString()!) : null;

        private string? GetString(Dictionary<string, object> dict, string key) =>
            dict.TryGetValue(key, out var val) ? val?.ToString() : null;

        private DateTime? GetDateTimeNullable(Dictionary<string, object> dict, string key) =>
            dict.TryGetValue(key, out var val) && val != null && DateTime.TryParse(val.ToString(), out var dt) ? dt : null;

        private decimal? GetDecimalNullable(Dictionary<string, object> dict, string key) =>
            dict.TryGetValue(key, out var val) && val != null && decimal.TryParse(val.ToString(), out var d) ? d : null;

        private bool GetBool(Dictionary<string, object> dict, string key, bool defaultVal) =>
            dict.TryGetValue(key, out var val) && val != null && bool.TryParse(val.ToString(), out var b) ? b : defaultVal;
    }
}
