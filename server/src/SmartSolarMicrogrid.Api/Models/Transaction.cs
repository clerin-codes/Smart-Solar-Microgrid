using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.Api.Models
{
    /// <summary>
    /// Transaction - MongoDB collection for energy transfer transactions (immutable ledger)
    /// </summary>
    public class Transaction
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("reservationId")]
        public string ReservationId { get; set; } = string.Empty;

        [BsonElement("gridOperatorId")]
        public string GridOperatorId { get; set; } = string.Empty;

        [BsonElement("prosumerId")]
        public string ProsumerId { get; set; } = string.Empty;

        [BsonElement("units")]
        public int? Units { get; set; }

        [BsonElement("amount")]
        public double? Amount { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "Completed"; // Completed, Failed, Pending

        [BsonElement("timestamp")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Timestamp { get; set; }
    }
}
