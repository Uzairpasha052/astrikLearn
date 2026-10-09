using System;
using System.Collections.Generic;

namespace backend.Model.Database;

public partial class Reminder
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    public DateOnly ReminderDate { get; set; }

    public string ReminderType { get; set; } = null!;

    public string? Message { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;
}
