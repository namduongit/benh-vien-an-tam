namespace api.Lib;

using BCrypt.Net;

public sealed class PasswordHasher
{
    public string Hash(string password)
    {
        string passwordHash = BCrypt.HashPassword(password);
        return passwordHash;
    }

    public bool Verify(string password, string passwordHash)
    {       
        return BCrypt.Verify(password, passwordHash);
    }
}