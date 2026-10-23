using backend.DTOs.InvoiceDTOs;
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;
using System.Text.Json;

namespace backend.Service;

public class InvoiceService
{
    private readonly IInvoiceRepository _repository;
    private readonly CurrentUserService _currentUser;
    private readonly AuditLogService _auditLogService;

    public InvoiceService(IInvoiceRepository repository, 
        CurrentUserService currentUser, AuditLogService auditLogService)
    {
        _repository = repository;
        _currentUser = currentUser;
        _auditLogService = auditLogService;
    }

    //public async Task<List<InvoiceDisplayDto>> GetAllAsync()
    //{
    //    var invoices = await _repository.GetAllAsync();

    //    return invoices.Select(MapToDto).ToList();
    //}

    public async Task<PagedResult<InvoiceDisplayDto>> GetAllAsync(PaginationRequest request)
    {
        var result = await _repository.GetPagedAsync(request);

        return new PagedResult<InvoiceDisplayDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            PageNumber = result.PageNumber,
            PageSize = result.PageSize,
        };
    }

    public async Task<InvoiceDisplayDto?> GetByIdAsync(int id)
    {
        var invoice  = await _repository.GetByIdAsync(id);

        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDisplayDto> CreateAsync(CreateInvoiceDto dto, int? userId)
    {
        if (dto.DueDate < dto.InvoiceDate)
        {
            throw new
                ArgumentException("Due date cannot be earlier than Invoice data.");
        }

        if (!await _repository.CustomerExistAsync(dto.CustomerId))
        {
            throw new KeyNotFoundException("Customer not Found.");
        }

        ValidateItems(dto.Items);

        var total = Math.Round(
            dto.Items.Sum(i => i.Quantity * i.UnitPrice), 2,
            MidpointRounding.AwayFromZero);

        var invoice = new Invoice
        {
            CustomerId = dto.CustomerId,
            InvoiceNumber = $"INV-{Guid.NewGuid().ToString("N")[..12]}".ToUpperInvariant(),
            //$"INV-{Guid.NewGuid():N}"
            //    .Substring(0, 12).ToUpperInvariant(),
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            Status = "Pending",
            TotalAmount = total,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsActive = true,
            IsDeleted = false,
        };

        foreach (var itemDto in dto.Items)
        {
            invoice.InvoiceItems.Add(new InvoiceItem
            {
                Description = itemDto.Description,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsActive = true,
                IsDeleted = false,
            });
        }

        await _repository.AddAsync(invoice);
        await _repository.SaveChangesAsync();

        var newValues = JsonSerializer.Serialize(new
        {
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.DueDate,
            invoice.Status,
            invoice.CreatedBy
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Create",
            "Invoice",
            invoice.Id.ToString(),
            null,
            newValues
        );

        var savedInvoice = await _repository.GetByIdAsync(invoice.Id);

        return MapToDto(savedInvoice!);
    }

    public async Task<InvoiceDisplayDto> UpdateAsync(int id, UpdateInvoiceDto dto, int? userId)
    {
        var invoice = await _repository.GetByIdAsync(id);

        if (invoice == null) { return null; }

        if (invoice.PaymentAllocations.Any(p => p.IsActive && !p.IsDeleted)) {
            throw new InvalidOperationException(
                "An invoice with payment allocations cannot be edited.");
        }

        if (dto.DueDate < dto.InvoiceDate)
            throw new ArgumentException(
                "Due date cannot be earlier than invoice date.");

        if (!await _repository.CustomerExistAsync(dto.CustomerId))
            throw new KeyNotFoundException("Customer not found.");

        ValidateItems(dto.Items);

        var oldValues = JsonSerializer.Serialize(new
        {
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.DueDate,
            invoice.Status,
            invoice.CreatedBy
        });

        invoice.CustomerId = dto.CustomerId;
        invoice.InvoiceDate = dto.InvoiceDate;
        invoice.DueDate = dto.DueDate;
        invoice.TotalAmount = Math.Round(
                            dto.Items.Sum(i => i.Quantity * i.UnitPrice), 2,
                            MidpointRounding.AwayFromZero);
        invoice.UpdatedAt = DateTime.UtcNow;
        invoice.UpdatedBy = userId;

        foreach(var oldItem in invoice.InvoiceItems)
        {
            oldItem.IsActive = false;
            oldItem.IsDeleted = true;
            oldItem.UpdatedAt = DateTime.UtcNow;
            oldItem.UpdatedBy = userId;
        }

        foreach(var itemDto in dto.Items)
        {
            invoice.InvoiceItems.Add(new InvoiceItem
            {
                Description = itemDto.Description.Trim(),
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
                IsActive = true,
                IsDeleted = false
            });
        }

        await _repository.SaveChangesAsync();

        var updateInvoice = await _repository.GetByIdAsync(id);

        var newValues = JsonSerializer.Serialize(new
        {
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.DueDate,
            invoice.Status,
            invoice.CreatedBy
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Update",
            "Invoice",
            invoice.Id.ToString(),
            oldValues,
            newValues
        );

        return MapToDto(updateInvoice!);
    }

    public async Task<bool> DeleteAsync(int id, int? userId)
    {
        var invoice = await _repository.GetByIdAsync(id);

        if(invoice == null) return false;

        if(invoice.PaymentAllocations.Any(p => p.IsActive && !p.IsDeleted))
        {
            throw new InvalidOperationException(
                "An invoice with payment allocations cannot be deleted.");
        }

        var oldValues = JsonSerializer.Serialize(new
        {
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.DueDate,
            invoice.Status,
            invoice.CreatedBy,
            invoice.IsActive
        });

        invoice.IsActive = false;
        invoice.IsDeleted = true;
        invoice.UpdatedAt = DateTime.UtcNow;
        invoice.UpdatedBy = userId;

        await _repository.SaveChangesAsync();

        var newValues = JsonSerializer.Serialize(new
        {
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.DueDate,
            invoice.Status,
            invoice.CreatedBy,
            invoice.IsActive
        });

        await _auditLogService.LogAsync(
            _currentUser.UserId,
            "Delete",
            "Invoice",
            invoice.Id.ToString(),
            oldValues,
            newValues
        );

        return true;
    }

    public static void ValidateItems(List<CreateInvoiceItemDto> Items)
    {
        if (Items.Count == 0)
        {
            throw new ArgumentException(
                "An invoice must contain at least one item.");
        }

        foreach (var item in Items)
        {
            if (string.IsNullOrWhiteSpace(item.Description))
            {
                throw new ArgumentException(
                   "Item description is required.");
            }

            if (item.Quantity <= 0 || item.UnitPrice <= 0)
            {
                throw new ArgumentException(
                   "Quantity and unit price must be greater than zero.");
            }
        }
    }

    private static InvoiceDisplayDto MapToDto(Invoice invoice)
    {
        var amountPaid = invoice.PaymentAllocations
            .Where(a =>
                a.IsActive &&
                !a.IsDeleted &&
                a.Payment.IsActive &&
                !a.Payment.IsDeleted)
            .Sum(a => a.AllocatedAmount);

        return new InvoiceDisplayDto
        {
            Id = invoice.Id,
            CustomerId = invoice.CustomerId,
            CustomerName = invoice.Customer.Name,
            InvoiceNumber = invoice.InvoiceNumber,
            InvoiceDate = invoice.InvoiceDate,
            DueDate = invoice.DueDate,
            Status = invoice.Status,
            TotalAmount = invoice.TotalAmount,
            AmountPaid = amountPaid,
            OutstandingAmount = invoice.TotalAmount - amountPaid,

            Items = invoice.InvoiceItems
                .Where(i => i.IsActive && !i.IsDeleted)
                .Select(i => new InvoiceItemDisplayDto
                {
                    Id = i.Id,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    Amount = i.Amount
                })
                .ToList()
        };
    }
}
