using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    public class EnergyReservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("reservationCode")]
        public string ReservationCode { get; set; } = string.Empty;

        [BsonElement("prosumerNic")]
        public string ProsumerNic { get; set; } = string.Empty;

        [BsonElement("prosumerName")]
        public string ProsumerName { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("stationId")]
        public string StationId { get; set; } = string.Empty;

        [BsonElement("stationName")]
        public string StationName { get; set; } = string.Empty;

        [BsonElement("energyAmountKWh")]
public double EnergyAmountKWh { get; set; }

[BsonElement("durationHours")]
public int DurationHours { get; set; } = 1;

[BsonElement("prosumerNic")]
public string ProsumerNic { get; set; } = string.Empty;

[BsonElement("prosumerName")]
public string ProsumerName { get; set; } = string.Empty;

[BsonElement("slotId")]
[BsonIgnoreIfNull]
public string? SlotId { get; set; }

[BsonElement("slotNumber")]
[BsonIgnoreIfNull]
public int? SlotNumber { get; set; }

[BsonElement("status")]
public string Status { get; set; } = "Pending";

[BsonElement("qrCodeData")]
public string QrCodeData { get; set; } = string.Empty;

[BsonElement("qrCodeExpiry")]
public DateTime? QrCodeExpiry { get; set; }

[BsonElement("completedAt")]
public DateTime? CompletedAt { get; set; }

[BsonElement("operatorNic")]
public string? OperatorNic { get; set; }

[BsonElement("operatorNotes")]
public string? OperatorNotes { get; set; }

[BsonElement("createdAt")]
public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

[BsonElement("updatedAt")]
public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}