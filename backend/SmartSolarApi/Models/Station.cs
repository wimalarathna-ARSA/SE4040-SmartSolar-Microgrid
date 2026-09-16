// ============================================================================
// File: Station.cs
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Legacy domain entity model for a basic solar charging station.
//              Superseded by the full SolarStationInfo model which supports GPS
//              coordinates, battery slot management, and operational schedules.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Legacy station entity for basic solar charging station data.
    /// Maps to the 'Stations' MongoDB collection (superseded by SolarStationInfo).
    /// </summary>
    public class Station
    {
        // Unique MongoDB ObjectId for this station record
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Human-readable name for this charging station
        public string Name { get; set; } = string.Empty;

        // Physical address or location description
        public string Location { get; set; } = string.Empty;

        // GPS Latitude coordinate of the station
        public double Latitude { get; set; }

        // GPS Longitude coordinate of the station
        public double Longitude { get; set; }
    }
}