using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using backend.Model.Database;

namespace backend.Data.Scaffolded;

public partial class BusinessDbContext : DbContext
{
    public BusinessDbContext(DbContextOptions<BusinessDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceItem> InvoiceItems { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<PaymentAllocation> PaymentAllocations { get; set; }

    public virtual DbSet<Reminder> Reminders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => e.Email, "IX_Customers_Email");

            entity.HasIndex(e => new { e.IsActive, e.IsDeleted }, "IX_Customers_IsActive_IsDeleted");

            entity.HasIndex(e => e.Name, "IX_Customers_Name");

            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(150);
            entity.Property(e => e.Phone).HasMaxLength(50);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(e => e.CustomerId, "IX_Invoices_CustomerId");

            entity.HasIndex(e => e.DueDate, "IX_Invoices_DueDate");

            entity.HasIndex(e => e.InvoiceDate, "IX_Invoices_InvoiceDate");

            entity.HasIndex(e => new { e.IsActive, e.IsDeleted }, "IX_Invoices_IsActive_IsDeleted");

            entity.HasIndex(e => e.Status, "IX_Invoices_Status");

            entity.HasIndex(e => e.InvoiceNumber, "UQ_Invoices_InvoiceNumber").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.InvoiceNumber).HasMaxLength(50);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Customer).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Invoices_Customer");
        });

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasIndex(e => e.InvoiceId, "IX_InvoiceItems_InvoiceId");

            entity.Property(e => e.Amount)
                .HasComputedColumnSql("([Quantity]*[UnitPrice])", true)
                .HasColumnType("decimal(37, 4)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Description).HasMaxLength(300);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Quantity).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceItems_Invoice");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(e => e.CustomerId, "IX_Payments_CustomerId");

            entity.HasIndex(e => e.PaymentDate, "IX_Payments_PaymentDate");

            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.ReferenceNumber).HasMaxLength(100);

            entity.HasOne(d => d.Customer).WithMany(p => p.Payments)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Customer");
        });

        modelBuilder.Entity<PaymentAllocation>(entity =>
        {
            entity.HasIndex(e => e.InvoiceId, "IX_PaymentAllocations_InvoiceId");

            entity.HasIndex(e => e.PaymentId, "IX_PaymentAllocations_PaymentId");

            entity.Property(e => e.AllocatedAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Invoice).WithMany(p => p.PaymentAllocations)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PaymentAllocations_Invoice");

            entity.HasOne(d => d.Payment).WithMany(p => p.PaymentAllocations)
                .HasForeignKey(d => d.PaymentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PaymentAllocations_Payment");
        });

        modelBuilder.Entity<Reminder>(entity =>
        {
            entity.HasIndex(e => e.InvoiceId, "IX_Reminders_InvoiceId");

            entity.HasIndex(e => e.ReminderDate, "IX_Reminders_ReminderDate");

            entity.HasIndex(e => e.Status, "IX_Reminders_Status");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.ReminderType).HasMaxLength(50);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Reminders)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reminders_Invoice");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
