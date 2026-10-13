using backend.DTOs.Pagination;
using backend.Helper;
using backend.Model;

namespace backend.Interface;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetAllAsync();
    Task<User> CreateAsync(User user);
    Task<PagedResult<User>> GetPageAsync(PaginationRequest request);

}
