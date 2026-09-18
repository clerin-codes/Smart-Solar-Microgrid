namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class UpdateReservationDto
{
    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}