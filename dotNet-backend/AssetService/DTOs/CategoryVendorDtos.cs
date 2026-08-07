namespace AssetService.DTOs
{
    public class AssetCategoryDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class VendorDto
    {
        public string VendorName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Phone { get; set; } = string.Empty;
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
