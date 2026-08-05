namespace AssetService.DTOs
{
    public class AssetDto
    {
        public long CategoryId { get; set; }
        public long VendorId { get; set; }
        public string AssetName { get; set; } = string.Empty;
        public string AssetTag { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal? PurchaseCost { get; set; }
        public DateTime? WarrantyExpiry { get; set; }
        public string Status { get; set; } = "AVAILABLE";
        public string? Remarks { get; set; }
    }
}
