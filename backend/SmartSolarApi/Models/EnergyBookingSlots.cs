// ============================================================================
// File: EnergyBookingSlots.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Model representing power trading reservation time slots for
//              energy drop-off and charging at microgrid nodes.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents a discrete energy trading time slot available at a solar station.
    /// Maps to the 'EnergyBookingSlots' MongoDB collection.
    /// </summary>
    public class EnergyBookingSlots
    {
        // Unique MongoDB ObjectId
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Associated SolarStationInfo unique identifier
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("stationId")]
        public string StationId { get; set; } = string.Empty;

        // Human-readable station name for denormalized query speed
        [BsonElement("stationName")]
        public string StationName { get; set; } = string.Empty;

        // Slot start timestamp (UTC)
        [BsonElement("slotStartTime")]
        public DateTime SlotStartTime { get; set; }

        // Slot end timestamp (UTC)
        [BsonElement("slotEndTime")]
        public DateTime SlotEndTime { get; set; }

        // Maximum power tradeable during this slot in kWh
        [BsonElement("maxCapacityKWh")]
        public double MaxCapacityKWh { get; set; }

        // Remaining unreserved capacity in kWh for this slot
        [BsonElement("availableCapacityKWh")]
        public double AvailableCapacityKWh { get; set; }

        // Trading price per kWh in local currency
        [BsonElement("pricePerKWh")]
        public decimal PricePerKWh { get; set; }
    }
}