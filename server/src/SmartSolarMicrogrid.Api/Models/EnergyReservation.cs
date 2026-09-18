using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models;

public class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string ReservationNumber { get; set; } = string.Empty;

    public string ProsumerNIC { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string StationId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public ReservationStatus Status { get; set; }
        = ReservationStatus.Pending;

    public string? QRToken { get; set; }

    public DateTime? QRGeneratedAt { get; set; }

    public TransactionStatus TransactionStatus { get; set; }
        = TransactionStatus.NotStarted;

    public string? ApprovedBy { get; set; }

    public string? CompletedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}