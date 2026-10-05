/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: UserDetails.cs
 * Purpose: Defines the MongoDB account document used for authentication and lifecycle management.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public class UserDetails
{
    // NIC is the immutable MongoDB primary key required by the assignment.
    [BsonId]
    public string NIC { get; set; } =
        string.Empty;

    // Store the account holder's editable personal/contact information.
    public string FullName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string PhoneNumber { get; set; } =
        string.Empty;

    // Store only a BCrypt hash; plain-text passwords must never be persisted.
    public string PasswordHash { get; set; } =
        string.Empty;

    // Store role values as readable strings in MongoDB.
    [BsonRepresentation(BsonType.String)]
    public UserRole Role { get; set; }

    // IsActive provides a fast authentication gate while Status records the lifecycle state.
    public bool IsActive { get; set; } =
        true;

    [BsonRepresentation(BsonType.String)]
    public AccountStatus Status { get; set; } =
        AccountStatus.Active;

    // Record the request time only when a Prosumer asks for deactivation.
    [BsonIgnoreIfNull]
    public DateTime? DeactivationRequestedAt { get; set; }

    // Maintain UTC audit timestamps for creation and the latest account update.
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } =
        DateTime.UtcNow;
}
