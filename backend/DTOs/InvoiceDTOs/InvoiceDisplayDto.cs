namespace backend.DTOs.InvoiceDTOs;

public class InvoiceDisplayDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;

    public DateOnly InvoiceDate { get; set; }
    public DateOnly DueDate { get; set; }

    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }

    public decimal AmountPaid { get; set; }
    public decimal OutstandingAmount { get; set; }

    public List<InvoiceItemDisplayDto> Items { get; set; } = new();
}
