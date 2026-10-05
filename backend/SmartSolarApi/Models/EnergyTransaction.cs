// ============================================================================
// File: EnergyTransaction.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Domain entity model recording a completed energy trade between
//              a buyer and a seller (prosumer) on the microgrid marketplace.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents a finalized energy trading transaction between two prosumer parties.
    /// Maps to the 'EnergyTransaction' MongoDB collection.
    /// </summary>
    public class EnergyTransaction
    {
        // Unique MongoDB ObjectId for this transaction record
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Reference to the EnergyOffer that triggered this transaction
        [BsonRepresentation(BsonType.ObjectId)]
        public string OfferId { get; set; } = string.Empty;

        // MongoDB ObjectId of the prosumer who purchased the energy
        [BsonRepresentation(BsonType.ObjectId)]
        public string BuyerId { get; set; } = string.Empty;

        // MongoDB ObjectId of the prosumer who sold the energy
        [BsonRepresentation(BsonType.ObjectId)]
        public string SellerId { get; set; } = string.Empty;

        // Total kilowatt-hours transferred in this transaction
        public double EnergyKWh { get; set; }

        // Total monetary amount settled for this energy trade
        public decimal TotalAmount { get; set; }

        // UTC timestamp when the transaction was recorded
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
