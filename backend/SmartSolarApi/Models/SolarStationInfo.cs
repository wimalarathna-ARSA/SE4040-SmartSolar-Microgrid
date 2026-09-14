// ============================================================================
// File: SolarStationInfo.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Model representing solar microgrid hubs with GPS location,
//              capacity specs (kW/h), battery storage slots, and schedules.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents a solar microgrid station/hub entity.
    /// Maps to the 'SolarStationInfo' MongoDB collection.
    /// </summary>
    public class SolarStationInfo
    {
        // Unique MongoDB ObjectId
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
    }
}