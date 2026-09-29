/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: Enums.cs
 * Purpose: Defines system roles and account lifecycle states.
 */

namespace SmartSolarMicrogrid.Api.Models;

public enum UserRole
{
    Backoffice = 0,
    GridOperator = 1,
    Prosumer = 2
}

public enum AccountStatus
{
    Active = 0,
    PendingActivation = 1,
    DeactivationRequested = 2,
    Deactivated = 3
}

public enum ReservationStatus
{
    Pending,
    Approved,
    Rejected,
    Cancelled,
    Completed
}

public enum SlotStatus
{
    Available,
    Full,
    Closed
}

public enum TransactionStatus
{
    NotStarted,
    Verified,
    Completed
}