namespace backend.DTOs.PaymentDTOs;

public class PaymentDisplayDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateOnly PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public decimal AmountAllocated { get; set; }
    public decimal UnallocatedAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }

}
