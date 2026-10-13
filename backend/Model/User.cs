
using backend.Model.Database;

namespace backend.Model;

public class User
{
    public int Id { get; set;}

    public string Name { get; set; } = string.Empty;

    public string Mail { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    //public string Role { get; set; } = string.Empty;
    public int RoleId { get; set; }

    public Role Role { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }

}
