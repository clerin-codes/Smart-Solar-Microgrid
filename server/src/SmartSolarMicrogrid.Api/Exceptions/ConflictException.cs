/*
 * Project: Smart Solar Microgrid Trading System
 * Module: Member 1 - Authentication and Accounts
 * File: ConflictException.cs
 * Purpose:
 * Represents an application-level conflict, such as duplicate NIC or email data.
 * The global exception middleware maps this exception to HTTP 409 Conflict.
 *
 * Contributors:
 * Sahanya - IT23214002
 * Sithmi - IT23241114
 * Clerin - IT23402584
 * Thuverakan - IT23281332
 */

namespace SmartSolarMicrogrid.Api.Exceptions;

/// <summary>
/// Represents a request that conflicts with the current state of a resource,
/// such as attempting to create an account with an existing NIC or email.
/// </summary>
public class ConflictException : Exception
{
    /// <summary>
    /// Creates a conflict exception with a client-safe error message.
    /// </summary>
    /// <param name="message">
    /// The conflict message that can be returned by the global exception middleware.
    /// </param>
    public ConflictException(string message)
        : base(message)
    {
        // Preserve the client-safe conflict message for centralized exception handling.
    }

    /// <summary>
    /// Creates a conflict exception while preserving the original exception
    /// for diagnostics and logging.
    /// </summary>
    /// <param name="message">
    /// The client-safe conflict message.
    /// </param>
    /// <param name="innerException">
    /// The original exception that caused the conflict.
    /// </param>
    public ConflictException(
        string message,
        Exception innerException)
        : base(
            message,
            innerException)
    {
        // Preserve the underlying exception while exposing only the safe conflict message.
    }
}