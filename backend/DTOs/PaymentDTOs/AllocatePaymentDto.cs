using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.PaymentDTOs;

public class AllocatePaymentDto
{
    [Required]
    [MinLength(1)]
    public List<PaymentAllocationItemDto> Allocations { get; set; } = new();
}

public class PaymentAllocationItemDto
{
    [Range(1, int.MaxValue)]
    public int InvoiceId { get; set; }

    [Range(typeof(decimal), "0.01", "9999999999999999")]
    public decimal AllocatedAmount { get; set; }

}
