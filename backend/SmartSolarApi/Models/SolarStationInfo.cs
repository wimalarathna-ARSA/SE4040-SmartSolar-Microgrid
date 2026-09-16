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

        // Human-readable station identifier code (e.g., "HUB-COLOMBO-01")
        [BsonElement("stationCode")]
        public string StationCode { get; set; } = string.Empty;

        // Name of the microgrid hub station
        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        // Street address or location description
        [BsonElement("location")]
        public string Location { get; set; } = string.Empty;

        // GPS Latitude coordinate for Google Maps integration
        [BsonElement("latitude")]
        public double Latitude { get; set; }

        // GPS Longitude coordinate for Google Maps integration
        [BsonElement("longitude")]
        public double Longitude { get; set; }

        // Energy capacity specification in kilowatt-hours (kW/h)
        [BsonElement("capacityKWh")]
        public double CapacityKWh { get; set; }

        // Number of available battery storage slots currently open for trading
        [BsonElement("availableBatterySlots")]
        public int AvailableBatterySlots { get; set; }

        // Total physical battery storage slots configured at this hub
        [BsonElement("totalBatterySlots")]
        public int TotalBatterySlots { get; set; }
    }
}