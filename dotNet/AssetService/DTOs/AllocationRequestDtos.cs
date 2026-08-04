namespace AssetService.DTOs
{
    public class AssetAllocationDto
    {
        public long AssetId { get; set; }
        public long EmployeeId { get; set; }
        public long AllocatedBy { get; set; }
        public DateTime AllocatedDate { get; set; }
        public DateTime? ExpectedReturnDate { get; set; }
        public DateTime? ReturnedDate { get; set; }
        public string AllocationStatus { get; set; } = "ACTIVE";
        public string? Remarks { get; set; }
    }

    public class AssetRequestDto
    {
        public long EmployeeId { get; set; }
        public long? CategoryId { get; set; }
        public long? AssetId { get; set; }
        public long? ApprovedBy { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "PENDING";
    }
}
