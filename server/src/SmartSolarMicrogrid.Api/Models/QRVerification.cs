using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models
{
    /// <summary>
    /// QR Verification - MongoDB collection for QR code records
    /// </summary>
    [BsonCollection("QRVerifications")]
    public class QRVerification : IEntity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("reservationId")]
        public string ReservationId { get; set; } = string.Empty;

        [BsonElement("token")]
        public string Token { get; set; } = string.Empty;

        [BsonElement("expiresAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime ExpiresAt { get; set; }

        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }

        [BsonElement("verifiedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        [BsonIgnoreIfNull]
        public DateTime? VerifiedAt { get; set; }
    }
}
