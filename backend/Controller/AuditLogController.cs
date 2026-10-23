using backend.DTOs.Pagination;
using backend.Interface;
using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller;

[Route("api/auditlog")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AuditLogController : ControllerBase
{
    private readonly AuditLogService _service;

    public AuditLogController(AuditLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
       [FromQuery] PaginationRequest request)
    {
        var result = await _service.GetPagedAsync(request);

        return Ok(result);
    }

}
