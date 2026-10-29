
using ClosedXML.Excel;
using backend.DTOs.CustomerDTOs;
using backend.Interface;
using backend.Model.Database;

namespace backend.Service;

public class CustomerExcelService
{
    private readonly ICustomerRepository _repository;

    public CustomerExcelService(ICustomerRepository repository)
    {
        _repository = repository;
    }

    public async Task<byte[]> ExportCustomerAsync()
    {
        var customers = await _repository.GetAllAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Customers");

        worksheet.Cell(1, 1).Value = "Name";
        worksheet.Cell(1, 2).Value = "Email";
        worksheet.Cell(1, 3).Value = "Phone";
        worksheet.Cell(1, 4).Value = "Address";
        worksheet.Cell(1, 5).Value = "IsActive";

        var header = worksheet.Range(1, 1, 1, 5);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.LightBlue;

        int row = 2;

        foreach (var cus in customers.Where(c => !c.IsDeleted))
        {
            worksheet.Cell(row, 1).Value = cus.Name;
            worksheet.Cell(row, 2).Value = cus.Email;
            worksheet.Cell(row, 3).Value = cus.Phone;
            worksheet.Cell(row, 4).Value = cus.Address;
            worksheet.Cell(row, 5).Value = cus.IsActive;

            row++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return stream.ToArray();
    }


    public async Task<string> ImportCustomerAsync(Stream fileStream)
    {
        using var workbook = new XLWorkbook(fileStream);

        var worksheet = workbook.Worksheet(1);
        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 0;

        if (lastRow < 2)
            throw new InvalidOperationException(
                "The Excel file contains no customer records.");

        string[] requiredHeaders =
        {
            "Name", "Email", "Phone", "Address"
        };

        for (int col = 1; col <= requiredHeaders.Length; col++)
        {
            var actualHeader = worksheet
                .Cell(1, col)
                .GetString()
                .Trim();

            if (!string.Equals(
                actualHeader,
                requiredHeaders[col - 1],
                StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Invalid Excel header in column {col}. " +
                    $"Expected '{requiredHeaders[col - 1]}'.");
            }
        }

        var existingCustomers = await _repository.GetAllAsync();

        var existingEmails = new HashSet<string>(
            existingCustomers
                .Where(c => !c.IsDeleted &&
                            !string.IsNullOrWhiteSpace(c.Email))
                .Select(c => c.Email!.Trim()),
            StringComparer.OrdinalIgnoreCase);

        var importedEmails = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        int imported = 0;
        var errors = new List<string>();

        for (int row = 2; row <= lastRow; row++)
        {
            var name = worksheet.Cell(row, 1).GetString().Trim();
            var email = worksheet.Cell(row, 2).GetString().Trim();
            var phone = worksheet.Cell(row, 3).GetString().Trim();
            var address = worksheet.Cell(row, 4).GetString().Trim();
            var activeText = worksheet.Cell(row, 5).GetString().Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                errors.Add($"Row {row}: Name is required.");
                continue;
            }

            if (!bool.TryParse(activeText, out bool isActive))
            {
                errors.Add(
                    $"Row {row}: IsActive must be TRUE or FALSE.");
                continue;
            }

            if (!string.IsNullOrWhiteSpace(email))
            {
                if (!importedEmails.Add(email))
                {
                    errors.Add(
                        $"Row {row}: Duplicate email '{email}' in this file.");
                    continue;
                }

                if (existingEmails.Contains(email))
                {
                    errors.Add(
                        $"Row {row}: Email '{email}' already exists.");
                    continue;
                }
            }

            var customer = new Customer
            {
                Name = name,
                Email = string.IsNullOrWhiteSpace(email) ? null : email,
                Phone = string.IsNullOrWhiteSpace(phone) ? null : phone,
                Address = string.IsNullOrWhiteSpace(address) ? null : address,
                IsActive = isActive,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(customer);

            if (!string.IsNullOrWhiteSpace(email))
                existingEmails.Add(email);

            imported++;
        }

        return $"Imported: {imported}. " +
               $"Skipped: {errors.Count}. " +
               string.Join(" | ", errors);

    }

}
