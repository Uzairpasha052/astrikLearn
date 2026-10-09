
namespace backend.Model;

public class User
{
    public int Id { get; set;}

    public string Name { get; set; } = string.Empty;

    public string Mail { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }

    // public string IsActive { get; set;} = "Active";
    // public string IsDeleted { get; set; } = "false";

}
