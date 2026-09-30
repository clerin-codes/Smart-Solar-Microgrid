/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UserDetails.cs
 * Purpose: Defines the MongoDB user-account document
 *          used for authentication and account management.
 */

using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public class UserDetails
{
    // ======================================================
    // Primary Identifier
    // ======================================================

    // NIC is used as the MongoDB document primary key.
    [BsonId]
    public string NIC { get; set; } =
        string.Empty;

    // ======================================================
    // Personal Information
    // ======================================================

    public string FullName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string PhoneNumber { get; set; } =
        string.Empty;

    // ======================================================
    // Authentication Information
    // ======================================================

    // Only the BCrypt hash is stored.
    // Plain-text passwords must never be stored.
    public string PasswordHash { get; set; } =
        string.Empty;

    // ======================================================
    // Authorization Role
    // ======================================================

    // Store the enum as a readable MongoDB string:
    // "Backoffice", "GridOperator", or "Prosumer".
    [BsonRepresentation(BsonType.String)]
    public UserRole Role { get; set; }

    // ======================================================
    // Account Lifecycle
    // ======================================================

    // Indicates whether the account is currently allowed
    // to authenticate and use protected API operations.
    public bool IsActive { get; set; } =
        true;

    /// <summary>
    /// Profile picture as base64 (no "data:" prefix), JPEG, PNG or WebP. Kept out of the raw user JSON
    /// (GET /api/users) so those lists stay small; the profile endpoints return it.
    /// </summary>
    [BsonIgnoreIfNull]
    [JsonIgnore]
    public string? ProfileImage { get; set; }

    // Store lifecycle status as a readable MongoDB string:
    // "Active",
    // "PendingActivation",
    // "DeactivationRequested",
    // or "Deactivated".
    [BsonRepresentation(BsonType.String)]
    public AccountStatus Status { get; set; } =
        AccountStatus.Active;

    // Records when a Prosumer requested account deactivation.
    public DateTime? DeactivationRequestedAt { get; set; }

    // ======================================================
    // Audit Information
    // ======================================================

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } =
        DateTime.UtcNow;
}