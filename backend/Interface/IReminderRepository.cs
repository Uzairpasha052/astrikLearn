
using backend.DTOs.Pagination;
using backend.Helper;
using backend.Model.Database;

namespace backend.Interface;

public interface IReminderRepository
{
    //Task<List<Reminder>> GetAllAsync();
    Task<PagedResult<Reminder>> GetAllAsync(PaginationRequest request);


    Task<Reminder?> GetByIdAsync(int id);

    Task<bool> InvoiceExistsAsync(int invoiceId);

    Task CreateAsync(Reminder reminder);

    Task UpdateAsync(Reminder reminder);

    Task<Reminder?> GetTrackedByIdAsync(int id);

    Task<bool> ExistsAsync(int id);

    Task<bool> SaveChangesAsync();
}
