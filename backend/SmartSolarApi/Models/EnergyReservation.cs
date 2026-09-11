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
    }
}