namespace backend.DTOs.CustomerDTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime Created { get; set; }

}
