using backend.DTOs.Pagination;
using backend.Helper;
using backend.Model.Database;

namespace backend.Interface;

public interface ICustomerRepository
{
    Task<List<Customer>> GetAllAsync();
    Task<Customer?> GetByIdAsync(int id);
    Task<Customer> CreateAsync(Customer customer);
    Task<Customer?> GetByEmailAsync(string email);

    Task<bool> UpdateAsync(Customer customer);

    Task<PagedResult<Customer>> GetPagedAsync(PaginationRequest request);
    //Task<bool> DeleteAsync(Customer customer);
}
