using backend.Data;
using backend.Model;
using backend.Model.Database;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class DbSeeder
{
    public static async Task SeedAsync(
        AppDbContext context,
        IConfiguration configuration)
    {
        string[] roleNames =
        {
             "Admin",
            "Sales",
            "Accountant",
        };

        foreach (var roleName in roleNames) 
        {
            bool exist = await context.Roles.AnyAsync(r => r.Name == roleName);

            if(!exist)
            {
                context.Roles.Add(new Role
                {
                    Name = roleName,
                });
            }
        }

        await context.SaveChangesAsync();

        var adminRole = await context.Roles
            .FirstAsync(r => r.Name == "Admin");

        string adminMail = configuration["SeedAdmin:Mail"]
            ?? throw new InvalidOperationException(
                "SeedAdmin:Mail is missing." );

        bool adminExist = await context.Users.AnyAsync(u => u.Mail == adminMail);

        if(adminExist) { return; }

        string adminName = configuration["SeedAdmin:Name"]
          ?? throw new InvalidOperationException(
              "SeedAdmin:Name is missing.");

        string adminPassword = configuration["SeedAdmin:Password"]
            ?? throw new InvalidOperationException(
                "SeedAdmin:Password is missing.");

        var admin = new User
        {
            Name = adminName,
            Mail = adminMail,
            Password = BCrypt.Net.BCrypt.HashPassword(
                adminPassword),
            RoleId = adminRole.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(admin);
        await context.SaveChangesAsync();
    }
}
