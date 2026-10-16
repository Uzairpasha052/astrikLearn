namespace backend.DTOs.InvoiceDTOs;

public class InvoiceItemDisplayDto
{
    public int Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? Amount { get; set; }
}
