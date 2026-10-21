using backend.DTOs.Pagination;
using backend.DTOs.Reminder;
using backend.Helper;
using backend.Interface;
using backend.Model.Database;

namespace backend.Service;

public class ReminderService
{
    private readonly IReminderRepository _repository;

    public ReminderService(IReminderRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResult<ReminderDisplayDto>> GetAllAsync(PaginationRequest request)
    {
        var reminders = await _repository.GetAllAsync(request);

        return new PagedResult<ReminderDisplayDto>
        {
            Items = reminders.Items.Select(MapToDto).ToList(),
            TotalCount = reminders.TotalCount,
            PageNumber = reminders.PageNumber,
            PageSize = reminders.PageSize
        };
    }

    public async Task<ReminderDisplayDto?> GetByIdAsync(int id)
    {
        var reminder = await _repository.GetByIdAsync(id);

        return reminder == null ? null : MapToDto(reminder);
    }

    public async Task<ReminderDisplayDto> CreateAsync(
       CreateReminderDto dto,
       int? userId)
    {
        if (!await _repository.InvoiceExistsAsync(dto.InvoiceId))
        {
            throw new ArgumentException(
                "The specified invoice does not exist or is inactive.");
        }

        var reminder = new Reminder
        {
            InvoiceId = dto.InvoiceId,
            ReminderDate = dto.ReminderDate,
            ReminderType = dto.ReminderType.Trim(),
            Message = dto.Message?.Trim(),
            //Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            IsActive = true,
            IsDeleted = false
        };

        await _repository.CreateAsync(reminder);
        await _repository.SaveChanges();

        var created = await _repository.GetByIdAsync(reminder.Id);

        if (created == null)
        {
            throw new InvalidOperationException(
                "Reminder was created but could not be retrieved.");
        }

        return MapToDto(created);
    }

    public async Task<ReminderDisplayDto?> UpdateAsync(
        int id,
        UpdateReminderDto dto,
        int? userId)
    {
        var existing = await _repository.GetTrackedByIdAsync(id);

        if (existing == null)
            return null;

        //if (existing.Status != "Pending")
        //{
        //    throw new InvalidOperationException(
        //        "Only pending reminders can be updated.");
        //}

        existing.ReminderDate = dto.ReminderDate;
        existing.ReminderType = dto.ReminderType.Trim();
        existing.Message = dto.Message?.Trim();
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = userId;

        await _repository.SaveChanges();
        var updated = await _repository.GetByIdAsync(id);

        return updated == null ? null : MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id, int? userId)
    {
        var existing = await _repository.GetTrackedByIdAsync(id);

        if (existing == null)
            return false;

        existing.IsDeleted = true;
        existing.IsActive = false;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = userId;

        await _repository.SaveChanges();

        return true;
    }

    private static ReminderDisplayDto MapToDto(Reminder reminder)
    {
        return new ReminderDisplayDto
        {
            Id = reminder.Id,
            InvoiceId = reminder.InvoiceId,
            InvoiceNumber = reminder.Invoice.InvoiceNumber,
            CustomerName = reminder.Invoice.Customer.Name,
            ReminderDate = reminder.ReminderDate,
            ReminderType = reminder.ReminderType,
            Message = reminder.Message,
            Status = reminder.Status,
            CreatedAt = reminder.CreatedAt,
            CreatedBy = reminder.CreatedBy,
            UpdatedAt = reminder.UpdatedAt,
            UpdatedBy = reminder.UpdatedBy
        };
    }

}
