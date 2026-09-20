// ============================================================================
// File: UserDetails.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Model representing user accounts including Backoffice,
//              Grid Operator, and Solar Prosumer. Prosumers use NIC as primary key.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Represents user accounts in the Smart Solar Microgrid Trading System.
    /// Maps to the 'UserDetails' MongoDB collection.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class UserDetails
    {
        [BsonId]
        public string Nic { get; set; } = string.Empty;

        [BsonElement("fullName")]
        public string FullName { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("role")]
        public string Role { get; set; } = "Prosumer";

        [BsonElement("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "PendingApproval";

        [BsonElement("deactivationRequested")]
        public bool DeactivationRequested { get; set; } = false;

        [BsonElement("deactivationReason")]
        public string? DeactivationReason { get; set; }

        [BsonElement("emailUpdateAccessGranted")]
        public bool EmailUpdateAccessGranted { get; set; } = false;

        [BsonElement("emailUpdateRequestStatus")]
        public string EmailUpdateRequestStatus { get; set; } = "None";

        [BsonElement("requestedNewEmail")]
        public string? RequestedNewEmail { get; set; }

        [BsonElement("emailUpdateRequestReason")]
        public string? EmailUpdateRequestReason { get; set; }

        [BsonElement("emailUpdateRequestDate")]
        public DateTime? EmailUpdateRequestDate { get; set; }

        [BsonElement("emailUpdateReviewNotes")]
        public string? EmailUpdateReviewNotes { get; set; }

        [BsonElement("emailUpdateHistory")]
        public List<DateTime> EmailUpdateHistory { get; set; } = new List<DateTime>();

        // GPS Latitude of the prosumer's solar panel installation site
        // Used for nearby nodes lookup
        [BsonElement("installationLatitude")]
        public double? InstallationLatitude { get; set; }

        // GPS Longitude of the prosumer's solar panel installation site
        // Used for nearby nodes lookup
        [BsonElement("installationLongitude")]
        public double? InstallationLongitude { get; set; }
    }
}