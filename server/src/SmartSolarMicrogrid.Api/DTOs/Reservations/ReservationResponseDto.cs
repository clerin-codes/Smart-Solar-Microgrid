using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class ReservationResponseDto
{
    public string Id { get; set; } = string.Empty;

    public string ReservationNumber { get; set; } = string.Empty;

    public string ProsumerNIC { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public ReservationStatus Status { get; set; }

    public string? QRToken { get; set; }

    public TransactionStatus TransactionStatus { get; set; }

    public DateTime CreatedAt { get; set; }
}