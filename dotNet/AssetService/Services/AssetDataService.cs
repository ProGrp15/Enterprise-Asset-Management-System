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
                _ => throw new ArgumentException("Unsupported resource")
            };

            if (!exists)
            {
                throw new KeyNotFoundException("Resource not found");
            }
        }

        public async Task<object> ListAsync(string type, long companyId)
        {
            return type switch
            {
                "asset" => await _db.Assets.Where(a => a.CompanyId == companyId).OrderByDescending(a => a.AssetId).ToListAsync(),
                "category" => await _db.AssetCategories.Where(c => c.CompanyId == companyId).OrderByDescending(c => c.CategoryId).ToListAsync(),
                "vendor" => await _db.Vendors.Where(v => v.CompanyId == companyId).OrderByDescending(v => v.VendorId).ToListAsync(),
                "purchase-order" => await _db.PurchaseOrders.Where(p => p.CompanyId == companyId).OrderByDescending(p => p.PurchaseOrderId).ToListAsync(),
                "maintenance" => await _db.ServiceTickets.Where(t => t.CompanyId == companyId).OrderByDescending(t => t.TicketId).ToListAsync(),
                "asset-allocation" => await _db.AssetAllocations.Where(a => a.CompanyId == companyId).OrderByDescending(a => a.AllocationId).ToListAsync(),
                "asset-request" => await _db.AssetRequests.Where(r => r.CompanyId == companyId).OrderByDescending(r => r.RequestId).ToListAsync(),
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        public async Task<object> OneAsync(string type, long companyId, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

            return type switch
            {
                "asset" => await _db.Assets.FindAsync(id) ?? throw new KeyNotFoundException(),
                "category" => await _db.AssetCategories.FindAsync(id) ?? throw new KeyNotFoundException(),
                "vendor" => await _db.Vendors.FindAsync(id) ?? throw new KeyNotFoundException(),
                "purchase-order" => await _db.PurchaseOrders.FindAsync(id) ?? throw new KeyNotFoundException(),
                "maintenance" => await _db.ServiceTickets.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-allocation" => await _db.AssetAllocations.FindAsync(id) ?? throw new KeyNotFoundException(),
                "asset-request" => await _db.AssetRequests.FindAsync(id) ?? throw new KeyNotFoundException(),
                _ => throw new ArgumentException("Unsupported resource")
            };
        }

        public async Task<object> CreateAsync(string type, long companyId, JsonElement body)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            switch (type)
            {
                case "asset":
                    var assetDto = body.Deserialize<AssetDto>(options)!;
                    _db.Assets.Add(new Asset
                    {
                        CompanyId = companyId, CategoryId = assetDto.CategoryId, VendorId = assetDto.VendorId,
                        AssetName = assetDto.AssetName, AssetTag = assetDto.AssetTag, SerialNumber = assetDto.SerialNumber,
                        Manufacturer = assetDto.Manufacturer, Model = assetDto.Model, PurchaseDate = assetDto.PurchaseDate,
                        PurchaseCost = assetDto.PurchaseCost, WarrantyExpiry = assetDto.WarrantyExpiry, Status = assetDto.Status ?? "AVAILABLE",
                        Remarks = assetDto.Remarks, CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "category":
                    var catDto = body.Deserialize<AssetCategoryDto>(options)!;
                    _db.AssetCategories.Add(new AssetCategory
                    {
                        CompanyId = companyId, CategoryName = catDto.CategoryName, Description = catDto.Description, CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "vendor":
                    var venDto = body.Deserialize<VendorDto>(options)!;
                    _db.Vendors.Add(new Vendor
                    {
                        CompanyId = companyId, VendorName = venDto.VendorName, ContactPerson = venDto.ContactPerson,
                        Email = venDto.Email, Phone = venDto.Phone, Address = venDto.Address, CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "purchase-order":
                    var poDto = body.Deserialize<PurchaseOrderDto>(options)!;
                    _db.PurchaseOrders.Add(new PurchaseOrder
                    {
                        CompanyId = companyId, VendorId = poDto.VendorId, OrderNumber = poDto.OrderNumber,
                        OrderDate = poDto.OrderDate, ExpectedDeliveryDate = poDto.ExpectedDeliveryDate,
                        TotalAmount = poDto.TotalAmount, Status = poDto.Status ?? "DRAFT", Remarks = poDto.Remarks, CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "maintenance":
                    var ticketDto = body.Deserialize<ServiceTicketDto>(options)!;
                    _db.ServiceTickets.Add(new ServiceTicket
                    {
                        CompanyId = companyId, AssetId = ticketDto.AssetId, EmployeeId = ticketDto.EmployeeId,
                        IssueDescription = ticketDto.IssueDescription, Priority = ticketDto.Priority ?? "MEDIUM",
                        Status = ticketDto.Status ?? "OPEN", CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-allocation":
                    var allocDto = body.Deserialize<AssetAllocationDto>(options)!;
                    _db.AssetAllocations.Add(new AssetAllocation
                    {
                        CompanyId = companyId, AssetId = allocDto.AssetId, EmployeeId = allocDto.EmployeeId,
                        AllocatedBy = allocDto.AllocatedBy, AllocatedDate = allocDto.AllocatedDate,
                        ExpectedReturnDate = allocDto.ExpectedReturnDate, AllocationStatus = allocDto.AllocationStatus ?? "ACTIVE",
                        Remarks = allocDto.Remarks, CreatedAt = DateTime.UtcNow
                    });
                    break;
                case "asset-request":
                    var reqDto = body.Deserialize<AssetRequestDto>(options)!;
                    _db.AssetRequests.Add(new AssetRequest
                    {
                        CompanyId = companyId, EmployeeId = reqDto.EmployeeId, CategoryId = reqDto.CategoryId,
                        AssetId = reqDto.AssetId, ApprovedBy = reqDto.ApprovedBy, RequestType = reqDto.RequestType,
                        Reason = reqDto.Reason, Status = reqDto.Status ?? "PENDING", RequestedAt = DateTime.UtcNow
                    });
                    break;
                default:
                    throw new ArgumentException("Unsupported resource");
            }

            await _db.SaveChangesAsync();
            return body;
        }

        public async Task<object> UpdateAsync(string type, long companyId, long id, JsonElement body)
        {
            await EnsureOwnedAsync(type, id, companyId);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            switch (type)
            {
                case "asset":
                    var asset = await _db.Assets.FindAsync(id);
                    var assetDto = body.Deserialize<AssetDto>(options)!;
                    asset!.CategoryId = assetDto.CategoryId; asset.VendorId = assetDto.VendorId; asset.AssetName = assetDto.AssetName;
                    asset.AssetTag = assetDto.AssetTag; asset.SerialNumber = assetDto.SerialNumber; asset.Manufacturer = assetDto.Manufacturer;
                    asset.Model = assetDto.Model; asset.PurchaseDate = assetDto.PurchaseDate; asset.PurchaseCost = assetDto.PurchaseCost;
                    asset.WarrantyExpiry = assetDto.WarrantyExpiry; asset.Status = assetDto.Status ?? "AVAILABLE"; asset.Remarks = assetDto.Remarks;
                    asset.UpdatedAt = DateTime.UtcNow;
                    break;
                case "category":
                    var category = await _db.AssetCategories.FindAsync(id);
                    var catDto = body.Deserialize<AssetCategoryDto>(options)!;
                    category!.CategoryName = catDto.CategoryName; category.Description = catDto.Description; category.IsActive = catDto.IsActive;
                    category.UpdatedAt = DateTime.UtcNow;
                    break;
                case "vendor":
                    var vendor = await _db.Vendors.FindAsync(id);
                    var venDto = body.Deserialize<VendorDto>(options)!;
                    vendor!.VendorName = venDto.VendorName; vendor.ContactPerson = venDto.ContactPerson; vendor.Email = venDto.Email;
                    vendor.Phone = venDto.Phone; vendor.Address = venDto.Address; vendor.IsActive = venDto.IsActive;
                    vendor.UpdatedAt = DateTime.UtcNow;
                    break;
                case "purchase-order":
                    var po = await _db.PurchaseOrders.FindAsync(id);
                    var poDto = body.Deserialize<PurchaseOrderDto>(options)!;
                    po!.VendorId = poDto.VendorId; po.OrderNumber = poDto.OrderNumber; po.OrderDate = poDto.OrderDate;
                    po.ExpectedDeliveryDate = poDto.ExpectedDeliveryDate; po.TotalAmount = poDto.TotalAmount; po.Status = poDto.Status ?? "DRAFT";
                    po.Remarks = poDto.Remarks; po.UpdatedAt = DateTime.UtcNow;
                    break;
                case "maintenance":
                    var ticket = await _db.ServiceTickets.FindAsync(id);
                    var ticketDto = body.Deserialize<ServiceTicketDto>(options)!;
                    ticket!.AssetId = ticketDto.AssetId; ticket.EmployeeId = ticketDto.EmployeeId; ticket.IssueDescription = ticketDto.IssueDescription;
                    ticket.Priority = ticketDto.Priority ?? "MEDIUM"; ticket.Status = ticketDto.Status ?? "OPEN"; ticket.ResolvedAt = ticketDto.ResolvedAt;
                    break;
                case "asset-allocation":
                    var alloc = await _db.AssetAllocations.FindAsync(id);
                    var allocDto = body.Deserialize<AssetAllocationDto>(options)!;
                    alloc!.AssetId = allocDto.AssetId; alloc.EmployeeId = allocDto.EmployeeId; alloc.AllocatedBy = allocDto.AllocatedBy;
                    alloc.AllocatedDate = allocDto.AllocatedDate; alloc.ExpectedReturnDate = allocDto.ExpectedReturnDate; alloc.ReturnedDate = allocDto.ReturnedDate;
                    alloc.AllocationStatus = allocDto.AllocationStatus ?? "ACTIVE"; alloc.Remarks = allocDto.Remarks;
                    break;
                case "asset-request":
                    var req = await _db.AssetRequests.FindAsync(id);
                    var reqDto = body.Deserialize<AssetRequestDto>(options)!;
                    req!.EmployeeId = reqDto.EmployeeId; req.CategoryId = reqDto.CategoryId; req.AssetId = reqDto.AssetId;
                    req.ApprovedBy = reqDto.ApprovedBy; req.RequestType = reqDto.RequestType; req.Reason = reqDto.Reason;
                    req.Status = reqDto.Status ?? "PENDING"; req.UpdatedAt = DateTime.UtcNow;
                    break;
            }

            await _db.SaveChangesAsync();
            return await OneAsync(type, companyId, id);
        }

        public async Task DeleteAsync(string type, long companyId, long id)
        {
            await EnsureOwnedAsync(type, id, companyId);

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
                }
            }

            await _db.SaveChangesAsync();
        }
    }
}
