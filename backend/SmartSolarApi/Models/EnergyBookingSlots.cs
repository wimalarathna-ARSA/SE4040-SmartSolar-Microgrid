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
    }
}