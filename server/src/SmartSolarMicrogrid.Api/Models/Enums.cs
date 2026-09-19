namespace SmartSolarMicrogrid.Api.Models;

public enum UserRole
{
    Backoffice,
    GridOperator,
    Prosumer
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