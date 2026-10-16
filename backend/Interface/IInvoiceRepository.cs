using backend.DTOs.Pagination;
using backend.Helper;
using backend.Model.Database;

namespace backend.Interface;

public interface IInvoiceRepository
{
    //Task<List<Invoice>> GetAllAsync();
    Task<PagedResult<Invoice>> GetPagedAsync(PaginationRequest request);
    Task<Invoice?> GetByIdAsync(int id);
    Task<bool> CustomerExistAsync(int customerId);
    Task AddAsync(Invoice invoice);
    Task SaveChangesAsync();

}
