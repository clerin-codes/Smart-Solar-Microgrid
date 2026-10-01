/*
 * File: ConflictException.cs
 * Project: Smart Solar Microgrid
 * Description: Represents an application conflict that maps to HTTP 409.
 * Author: Shakanyah - IT23214002
 * Author: Sithmi - IT23241114
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

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
        // Responsible: Shakanyah - IT23214002; Sithmi - IT23241114; Clerin - IT23402584; Thuverakan - IT23281332
        // Preserve the conflict message for the global exception middleware.
    }
}
