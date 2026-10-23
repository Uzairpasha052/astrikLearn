using backend.DTOs.Pagination;
using backend.DTOs.PaymentDTOs;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using System.Text.Json;

namespace backend.Service;

public class PaymentService
{
    private readonly IPaymentRepository _repository;
    private readonly AuditLogService _auditLogService;
    private readonly CurrentUserService _currentUser;

    public PaymentService(IPaymentRepository repository, 
        AuditLogService auditLogService, CurrentUserService currentUser)
    {
        _repository = repository;
        _auditLogService = auditLogService;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<PaymentDisplayDto>> GetAllAsync(PaginationRequest request)
    {
        var payments = await _repository.GetAllAsync(request);

        return new PagedResult<PaymentDisplayDto>
        {
            Items = payments.Items.Select(MapToDto).ToList(),
            TotalCount = payments.TotalCount,
            PageNumber = payments.PageNumber,
            PageSize = payments.PageSize
        };
    }

    public async Task<PaymentDisplayDto> GetByIdAsync(int id)
    {
        var payment = await _repository.GetByIdAsync(id);

        if (payment == null)
            throw new KeyNotFoundException("Payment not found.");

        return MapToDto(payment);
    }

    public async Task<PaymentDisplayDto> CreateAsync(
        CreatePaymentDto dto,
        int? userId )
    {
        if (dto.Amount <= 0)
            throw new ArgumentException(
                "Payment amount must be greater than zero.");

        if (!await _repository.CustomerExistsAsync(dto.CustomerId))
            throw new ArgumentException("Customer not found or inactive.");

        var payment = new Payment
        {
            CustomerId = dto.CustomerId,
            PaymentDate = dto.PaymentDate,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            ReferenceNumber = dto.ReferenceNumber,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsActive = true,
            IsDeleted = false
        };

        await _repository.AddAsync(payment);
        await _repository.SaveChangesAsync();

        var newValues = JsonSerializer.Serialize(new
        {
            payment.Id,
            payment.PaymentMethod,
            payment.CreatedAt,
            payment.CreatedBy
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Create",
            "Payment",
            payment.Id.ToString(),
            null,
            newValues
        );

        var savedPayment = await _repository.GetByIdAsync(payment.Id);
        return MapToDto(savedPayment!);
    }

     public async Task<List<PaymentAllocationDisplayDto>> AllocateAsync(
        int paymentId,
        AllocatePaymentDto dto,
        int? userId)
    {
        if (dto.Allocations == null || dto.Allocations.Count == 0)
            throw new ArgumentException(
                "At least one allocation is required.");

        if (dto.Allocations.Any(a => a.InvoiceId <= 0 ||
                                     a.AllocatedAmount <= 0))
            throw new ArgumentException(
                "Invoice IDs and allocation amounts must be positive.");

        if (dto.Allocations
            .GroupBy(a => a.InvoiceId)
            .Any(g => g.Count() > 1))
            throw new ArgumentException(
                "Each invoice can appear only once per allocation request.");

        var payment = await _repository.GetByIdAsync(paymentId);

        if (payment == null)
            throw new KeyNotFoundException("Payment not found.");

        var alreadyAllocated = payment.PaymentAllocations
            .Where(a => a.IsActive && !a.IsDeleted)
            .Sum(a => a.AllocatedAmount);

        var requestedTotal = dto.Allocations
            .Sum(a => a.AllocatedAmount);

        if (requestedTotal > payment.Amount - alreadyAllocated)
            throw new InvalidOperationException(
                "Allocations exceed the payment's unallocated amount.");

        var newAllocations = new List<PaymentAllocation>();
        var invoiceUpdates = new List<(Invoice Invoice, decimal NewPaidAmount)>();

        foreach (var item in dto.Allocations)
        {
            var invoice = await _repository
                .GetInvoiceForAllocationAsync(item.InvoiceId);

            if (invoice == null)
                throw new KeyNotFoundException(
                    $"Invoice {item.InvoiceId} was not found or is inactive.");

            if (invoice.CustomerId != payment.CustomerId)
                throw new InvalidOperationException(
                    "The payment and invoice must belong to the same customer.");

            var paidAmount = invoice.PaymentAllocations
                .Where(a => a.IsActive &&
                            !a.IsDeleted &&
                            a.Payment.IsActive &&
                            !a.Payment.IsDeleted)
                .Sum(a => a.AllocatedAmount);

            var outstanding = invoice.TotalAmount - paidAmount;

            if (item.AllocatedAmount > outstanding)
                throw new InvalidOperationException(
                    $"Allocation exceeds the outstanding balance of invoice {invoice.InvoiceNumber}.");

            newAllocations.Add(new PaymentAllocation
            {
                PaymentId = payment.Id,
                InvoiceId = invoice.Id,
                AllocatedAmount = item.AllocatedAmount,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsActive = true,
                IsDeleted = false
            });

            invoiceUpdates.Add((
                invoice,
                paidAmount + item.AllocatedAmount
            ));
        }

        foreach (var update in invoiceUpdates)
        {
            update.Invoice.Status = GetInvoiceStatus(
                update.Invoice,
                update.NewPaidAmount);

            update.Invoice.UpdatedAt = DateTime.UtcNow;
            update.Invoice.UpdatedBy = userId;
        }

        await _repository.AddAllocationsAsync(newAllocations);

        //var oldValues = JsonSerializer.Serialize(new
        //{
        //    PaymentId = payment.Id,
        //    PreviouslyAllocatedAmount = alreadyAllocated,
        //    PreviouslyUnallocatedAmount = payment.Amount - alreadyAllocated
        //});

        var newValues = JsonSerializer.Serialize(new
        {
            PaymentId = payment.Id,
            Allocations = newAllocations.Select(a => new
            {
                //a.Id,
                a.InvoiceId,
                a.AllocatedAmount
            }).ToList(),
            TotalAllocatedAmount = alreadyAllocated + requestedTotal,
            RemainingUnallocatedAmount =
                payment.Amount - (alreadyAllocated + requestedTotal)
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId ?? userId,
            "Create",
            "PaymentAllocation",
            payment.Id.ToString(),
            null,
            newValues);


        await _repository.SaveChangesAsync();

        return newAllocations.Select(a =>
        {
            var invoice = invoiceUpdates
                .First(x => x.Invoice.Id == a.InvoiceId).Invoice;

            return new PaymentAllocationDisplayDto
            {
                Id = a.Id,
                PaymentId = a.PaymentId,
                InvoiceId = a.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                AllocatedAmount = a.AllocatedAmount,
                CreatedAt = a.CreatedAt
            };
        }).ToList();
     }

    private static string GetInvoiceStatus(
       Invoice invoice,
       decimal amountPaid)
    {
        if (amountPaid >= invoice.TotalAmount)
            return "Paid";

        if (amountPaid > 0)
            return "Partially Paid";

        if (invoice.DueDate <
            DateOnly.FromDateTime(DateTime.UtcNow))
            return "Overdue";

        return "Pending";
    }

    private static PaymentDisplayDto MapToDto(Payment payment)
    {
        var amountAllocated = payment.PaymentAllocations
            .Where(a => a.IsActive && !a.IsDeleted)
            .Sum(a => a.AllocatedAmount);

        return new PaymentDisplayDto
        {
            Id = payment.Id,
            CustomerId = payment.CustomerId,
            CustomerName = payment.Customer.Name,
            PaymentDate = payment.PaymentDate,
            Amount = payment.Amount,
            AmountAllocated = amountAllocated,
            UnallocatedAmount = payment.Amount - amountAllocated,
            PaymentMethod = payment.PaymentMethod,
            ReferenceNumber = payment.ReferenceNumber,
            Notes = payment.Notes
        };
    }

}
