using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.InvoiceDTOs;

public class CreateInvoiceDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int CustomerId { get; set; }

    [Required]
    public DateOnly InvoiceDate { get; set; }

    [Required]
    public DateOnly DueDate { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateInvoiceItemDto> Items { get; set; } = new();

}

public class CreateInvoiceItemDto
{
    [Required]
    [StringLength(300)]
    public string Description { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "9999999999999999")]
    public decimal Quantity { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999999")]
    public decimal UnitPrice { get; set; }

}
