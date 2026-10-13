using backend.Model;

namespace backend.Interface;

public interface ITokenService
{
    string GenerateToken(User user);
}

