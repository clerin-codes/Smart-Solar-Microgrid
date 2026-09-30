namespace SmartSolarMicrogrid.Api.Exceptions;

/// <summary>
/// Thrown when a request conflicts with existing data
/// (for example, a NIC or email that is already registered).
/// Mapped to HTTP 409 by the exception handling middleware.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message)
        : base(message)
    {
    }
}
