// ============================================================================
// File: EnergyReservation.cs
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Model representing power trading reservations made by prosumers,
//              enforcing 7-day schedule window and 12-hour cancellation notice.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents an energy drop-off or charging reservation made by a solar prosumer.
    /// Maps to the 'EnergyReservation' MongoDB collection.
    /// </summary>
    public class EnergyReservation
    {
        // Unique MongoDB ObjectId
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Human-friendly unique booking reference (e.g., "RES-98231")
        [BsonElement("reservationCode")]
        public string ReservationCode { get; set; } = string.Empty;

        // Prosumer National Identity Card (NIC) - Primary Key link to UserDetails
        [BsonElement("prosumerNic")]
        public string ProsumerNic { get; set; } = string.Empty;

        // Cached prosumer full name for immediate display
        [BsonElement("prosumerName")]
        public string ProsumerName { get; set; } = string.Empty;

        // Identifier of the targeted solar station
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("stationId")]
        public string StationId { get; set; } = string.Empty;

        // Station name at time of booking
        [BsonElement("stationName")]
        public string StationName { get; set; } = string.Empty;

        // Identifier of selected EnergyBookingSlots record (optional)
        [BsonElement("slotId")]
        [BsonIgnoreIfNull]
        public string? SlotId { get; set; }

        // Physical battery slot number at station (e.g. Slot 1, 2, 3...)
        [BsonElement("slotNumber")]
        [BsonIgnoreIfNull]
        public int? SlotNumber { get; set; }

        // Scheduled start timestamp (must be <= Now + 7 days)
        [BsonElement("scheduledDateTime")]
        public DateTime ScheduledDateTime { get; set; }

        // Duration of reservation in hours
        [BsonElement("durationHours")]
        public int DurationHours { get; set; } = 1;

        // Amount of energy to trade in kWh (either drop-off to grid or charging from grid)
        [BsonElement("energyAmountKWh")]
        public double EnergyAmountKWh { get; set; }

        // Total calculated transaction cost or credit
        [BsonElement("totalCost")]
        public decimal TotalCost { get; set; }

        // Reservation nature: "DropOff" (prosumer selling) or "Charging" (prosumer buying)
        [BsonElement("reservationType")]
        public string ReservationType { get; set; } = "DropOff";

        // Lifecycle status: "Pending", "Approved", "Completed", "Cancelled"
        [BsonElement("status")]
        public string Status { get; set; } = "Pending";

        // Encrypted / signed QR payload string dispatched to prosumer for operator scanning
        [BsonElement("qrCodeData")]
        public string QrCodeData { get; set; } = string.Empty;

        // Timestamp when operator scanned and finalized the job
        [BsonElement("completedAt")]
        public DateTime? CompletedAt { get; set; }

        // NIC or username of the Grid Operator who finalized this transaction
        [BsonElement("operatorNic")]
        public string? OperatorNic { get; set; }

        // Optional operator audit notes upon physical verification
        [BsonElement("operatorNotes")]
        public string? OperatorNotes { get; set; }

        // Timestamp of reservation creation
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Timestamp of most recent update
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}