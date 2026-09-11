// ============================================================================
// File: EnergyOffer.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Domain entity model representing an energy sell offer placed by
//              a solar prosumer in the microgrid trading marketplace.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents a prosumer's energy sell offer listed on the microgrid marketplace.
    /// Maps to the 'EnergyOffer' MongoDB collection.
    /// </summary>
    public class EnergyOffer
    {
        // Unique MongoDB ObjectId for this energy offer record
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Reference to the prosumer (seller) who posted this energy offer
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProsumerId { get; set; } = string.Empty;

        // Amount of energy being offered for sale in kilowatt-hours (kWh)
        public double EnergyKWh { get; set; }

        // Asking price per kilowatt-hour in local currency
        public decimal PricePerKWh { get; set; }

        // Offer status: "Available", "Sold", "Cancelled"
        public string Status { get; set; } = "Available";

        // UTC timestamp when this energy offer was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
