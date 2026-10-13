namespace backend.DTOs.Pagination;

public class PaginationRequest
{
    public int pageNumber { get; set; } = 1;
    public int pageSize { get; set; } = 10;

}
