//using Microsoft.EntityFrameworkCore;
//using backend.Model;

//public class AppDbContext : DbContext
//{
//    public AppDbContext(DbContextOptions<AppDbContext> options)
//        : base(options)
//    {
//    }

//    public DbSet<User> Users { get; set; }

//}



using Microsoft.EntityFrameworkCore;
using backend.Model;
using backend.Model.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // Existing User table through CodeFirst approach
    public DbSet<User> Users { get; set; }

    // Business tables through DatabaseFirst approach
    public DbSet<Customer> Customers { get; set; }

    public DbSet<Invoice> Invoices { get; set; }

    public DbSet<InvoiceItem> InvoiceItems { get; set; }

    public DbSet<Payment> Payments { get; set; }

    public DbSet<PaymentAllocation> PaymentAllocations { get; set; }

    public DbSet<Reminder> Reminders { get; set; }

    public DbSet<Role> Roles { get; set; }

    //protected override void OnModelCreating(ModelBuilder modelBuilder)
    //{
    //    base.OnModelCreating(modelBuilder);

    //    modelBuilder.Entity<User>()
    //        .HasOne(u => u.Role)
    //        .WithMany(r => r.Users)
    //        .HasForeignKey(u => u.RoleId);
    //}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // =====================================================
        // Role
        // =====================================================

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId);

        // =====================================================
        // Customer
        // =====================================================

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => e.Email, "IX_Customers_Email");

            entity.HasIndex(
                e => new { e.IsActive, e.IsDeleted },
                "IX_Customers_IsActive_IsDeleted");

            entity.HasIndex(e => e.Name, "IX_Customers_Name");

            entity.Property(e => e.Address)
                .HasMaxLength(300);

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.Email)
                .HasMaxLength(150);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.Name)
                .HasMaxLength(150);

            entity.Property(e => e.Phone)
                .HasMaxLength(50);

            // CreatedBy -> Users.Id
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Customers_CreatedBy");

            // UpdatedBy -> Users.Id
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Customers_UpdatedBy");
        });


        // =====================================================
        // Invoice
        // =====================================================

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(e => e.CustomerId, "IX_Invoices_CustomerId");

            entity.HasIndex(e => e.DueDate, "IX_Invoices_DueDate");

            entity.HasIndex(e => e.InvoiceDate, "IX_Invoices_InvoiceDate");

            entity.HasIndex(
                e => new { e.IsActive, e.IsDeleted },
                "IX_Invoices_IsActive_IsDeleted");

            entity.HasIndex(e => e.Status, "IX_Invoices_Status");

            entity.HasIndex(
                e => e.InvoiceNumber,
                "UQ_Invoices_InvoiceNumber")
                .IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.InvoiceNumber)
                .HasMaxLength(50);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");

            entity.Property(e => e.TotalAmount)
                .HasColumnType("decimal(18, 2)");

            // Customer -> Invoices
            entity.HasOne(e => e.Customer)
                .WithMany(e => e.Invoices)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Invoices_Customer");

            // CreatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Invoices_CreatedBy");

            // UpdatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Invoices_UpdatedBy");
        });


        // =====================================================
        // InvoiceItem
        // =====================================================

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasIndex(
                e => e.InvoiceId,
                "IX_InvoiceItems_InvoiceId");

            entity.Property(e => e.Amount)
                .HasComputedColumnSql(
                    "([Quantity]*[UnitPrice])",
                    true)
                .HasColumnType("decimal(37, 4)");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.Description)
                .HasMaxLength(300);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.Quantity)
                .HasColumnType("decimal(18, 2)");

            entity.Property(e => e.UnitPrice)
                .HasColumnType("decimal(18, 2)");

            // Invoice -> InvoiceItems
            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.InvoiceItems)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_InvoiceItems_Invoice");

            // CreatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_InvoiceItems_CreatedBy");

            // UpdatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_InvoiceItems_UpdatedBy");
        });


        // =====================================================
        // Payment
        // =====================================================

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(
                e => e.CustomerId,
                "IX_Payments_CustomerId");

            entity.HasIndex(
                e => e.PaymentDate,
                "IX_Payments_PaymentDate");

            entity.Property(e => e.Amount)
                .HasColumnType("decimal(18, 2)");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.Notes)
                .HasMaxLength(500);

            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50);

            entity.Property(e => e.ReferenceNumber)
                .HasMaxLength(100);

            // Customer -> Payments
            entity.HasOne(e => e.Customer)
                .WithMany(e => e.Payments)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Payments_Customer");

            // CreatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Payments_CreatedBy");

            // UpdatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Payments_UpdatedBy");
        });


        // =====================================================
        // PaymentAllocation
        // =====================================================

        modelBuilder.Entity<PaymentAllocation>(entity =>
        {
            entity.HasIndex(
                e => e.InvoiceId,
                "IX_PaymentAllocations_InvoiceId");

            entity.HasIndex(
                e => e.PaymentId,
                "IX_PaymentAllocations_PaymentId");

            entity.Property(e => e.AllocatedAmount)
                .HasColumnType("decimal(18, 2)");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            // Invoice -> PaymentAllocations
            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.PaymentAllocations)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_PaymentAllocations_Invoice");

            // Payment -> PaymentAllocations
            entity.HasOne(e => e.Payment)
                .WithMany(e => e.PaymentAllocations)
                .HasForeignKey(e => e.PaymentId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_PaymentAllocations_Payment");

            // CreatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_PaymentAllocations_CreatedBy");

            // UpdatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_PaymentAllocations_UpdatedBy");
        });


        // =====================================================
        // Reminder
        // =====================================================

        modelBuilder.Entity<Reminder>(entity =>
        {
            entity.HasIndex(
                e => e.InvoiceId,
                "IX_Reminders_InvoiceId");

            entity.HasIndex(
                e => e.ReminderDate,
                "IX_Reminders_ReminderDate");

            entity.HasIndex(
                e => e.Status,
                "IX_Reminders_Status");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.Property(e => e.Message)
                .HasMaxLength(500);

            entity.Property(e => e.ReminderType)
                .HasMaxLength(50);

            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");

            // Invoice -> Reminders
            entity.HasOne(e => e.Invoice)
                .WithMany(e => e.Reminders)
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Reminders_Invoice");

            // CreatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Reminders_CreatedBy");

            // UpdatedBy -> Users
            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .HasConstraintName("FK_Reminders_UpdatedBy");
        });
    }
}