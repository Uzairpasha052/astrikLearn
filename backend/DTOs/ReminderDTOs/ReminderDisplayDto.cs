
namespace backend.DTOs.Reminder;

public class ReminderDisplayDto
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    public string InvoiceNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public DateOnly ReminderDate { get; set; }

    public string ReminderType { get; set; } = string.Empty;

    public string? Message { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }
}
