using backend.Model.Database;
using backend.DTOs.Pagination;
using backend.Helper;

namespace backend.Interface;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog auditLog);

    Task<PagedResult<AuditLog>> GetPagedAsync(PaginationRequest request);

}