using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    public class Reservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string StationId { get; set; } = string.Empty;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}