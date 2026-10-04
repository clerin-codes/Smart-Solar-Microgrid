/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: ConflictException.cs
 * Purpose: Represents requests that conflict with existing unique account data.
 */

namespace SmartSolarMicrogrid.Api.Exceptions;

public class ConflictException : Exception
{
    public ConflictException(
        string message)
        : base(message)
    {
        // Preserve a client-safe conflict message for the global exception middleware.
    }

    public ConflictException(
        string message,
        Exception innerException)
        : base(
            message,
            innerException)
    {
        // Preserve the original database exception for diagnostics while returning a safe message.
    }
}