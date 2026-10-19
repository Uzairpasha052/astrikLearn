using backend.DTOs.Pagination;
using backend.Helper;
using backend.Model.Database;

namespace backend.Interface;

public interface IPaymentRepository
{
    Task<PagedResult<Payment>> GetAllAsync(PaginationRequest request);

    Task<Payment?> GetByIdAsync(int id);

    Task<bool> CustomerExistsAsync(int customerId);

    Task<Invoice?> GetInvoiceForAllocationAsync(int invoiceId);

    Task AddAsync(Payment payment);

    Task AddAllocationsAsync(IEnumerable<PaymentAllocation> allocations);

    Task SaveChangesAsync();
}
