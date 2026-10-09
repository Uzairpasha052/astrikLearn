using System;
using System.Collections.Generic;

namespace backend.Model.Database;

public partial class PaymentAllocation
{
    public int Id { get; set; }

    public int PaymentId { get; set; }

    public int InvoiceId { get; set; }

    public decimal AllocatedAmount { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual Payment Payment { get; set; } = null!;
}
