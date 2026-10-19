
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs.Reminder;

public class UpdateReminderDto
{
    [Required]
    public DateOnly ReminderDate { get; set; }

    [Required]
    [StringLength(50)]
    public string ReminderType { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Message { get; set; }
}
