namespace AssetService.DTOs
{
    public class PurchaseOrderDto
    {
        public long VendorId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "DRAFT";
        public string? Remarks { get; set; }
    }

    public class ServiceTicketDto
    {
        public long AssetId { get; set; }
        public long EmployeeId { get; set; }
        public string IssueDescription { get; set; } = string.Empty;
        public string Priority { get; set; } = "MEDIUM";
        public string Status { get; set; } = "OPEN";
        public DateTime? ResolvedAt { get; set; }
    }
}
