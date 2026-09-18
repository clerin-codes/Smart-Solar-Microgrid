namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class CreateReservationDto
{
    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}