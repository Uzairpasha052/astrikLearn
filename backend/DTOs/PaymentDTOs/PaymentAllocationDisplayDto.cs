namespace backend.DTOs.PaymentDTOs;

public class PaymentAllocationDisplayDto
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal AllocatedAmount { get; set; }
    public DateTime CreatedAt { get; set; }

}
