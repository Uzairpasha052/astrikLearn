using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.InvoiceDTOs;

public class UpdateInvoiceDto
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
