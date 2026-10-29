using backend.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace backend.Controller;

[ApiController]
[Route("api/customer/excel")]
[Authorize]
public class CustomerExcelController : ControllerBase
{
    private readonly CustomerExcelService _excelService;

    public CustomerExcelController(CustomerExcelService excelService)
    {
        _excelService = excelService;
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCustomers()
    {
        var file = await _excelService.ExportCustomerAsync();

        return File(
            file,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Customers_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx");
    }

    [HttpPost("import")]
    [Authorize(Roles = "Admin,Sales")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportCustomers(
        [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Please upload an Excel file.");

        if (!Path.GetExtension(file.FileName)
            .Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only .xlsx files are supported.");
        }

        try
        {
            using var stream = file.OpenReadStream();

            var result = await _excelService
                .ImportCustomerAsync(stream);

            return Ok(new { message = result });
        }
        catch (Exception ex) when (
            ex is InvalidOperationException //||
            //ex is ClosedXML.Excel.XLWorkbookException
            )
        {
            return BadRequest(new { message = ex.Message });
        }
    }


}