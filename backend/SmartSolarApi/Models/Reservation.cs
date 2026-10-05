// ============================================================================
// File: Reservation.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Legacy domain entity model representing a basic station booking.
//              Superseded by the full EnergyReservation model which enforces
//              the 7-day and 12-hour business rules.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Legacy reservation entity for basic station slot bookings.
    /// Maps to the 'Reservations' MongoDB collection (superseded by EnergyReservation).
    /// </summary>
    public class Reservation
    {
        // Unique MongoDB ObjectId for this reservation record
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Reference to the user who created this reservation
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        // Reference to the solar station where the slot is booked
        [BsonRepresentation(BsonType.ObjectId)]
        public string StationId { get; set; } = string.Empty;

        // Scheduled start timestamp of the reservation slot
        public DateTime StartTime { get; set; }

        // Scheduled end timestamp of the reservation slot
        public DateTime EndTime { get; set; }

        // Reservation status: "Active", "Completed", "Cancelled"
        public string Status { get; set; } = "Active";

        // QR code payload string issued to the user for operator verification
        public string QrCode { get; set; } = string.Empty;

        // UTC timestamp when this reservation record was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
