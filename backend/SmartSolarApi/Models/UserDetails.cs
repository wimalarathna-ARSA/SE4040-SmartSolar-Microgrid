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
        // MongoDB document identifier is the user's NIC.
        [BsonId]
        public string Nic { get; set; } = string.Empty;

        // Full legal name of the user
        [BsonElement("fullName")]
        public string FullName { get; set; } = string.Empty;

        // Registered unique email address
        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        // Secure BCrypt hashed password
        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        // Role: "Backoffice", "GridOperator", or "Prosumer"
        [BsonElement("role")]
        public string Role { get; set; } = "Prosumer";

        // Contact phone number
        [BsonElement("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        // Physical address / solar installation address
        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;

        // Account status: "PendingApproval", "Active", "Deactivated"
        [BsonElement("status")]
        public string Status { get; set; } = "PendingApproval";

        // Flag if prosumer requested deactivation
        [BsonElement("deactivationRequested")]
        public bool DeactivationRequested { get; set; } = false;

        // Reason provided when requesting deactivation
        [BsonElement("deactivationReason")]
        public string? DeactivationReason { get; set; }

        // Flag indicating if Backoffice has granted permission to update email
        [BsonElement("emailUpdateAccessGranted")]
        public bool EmailUpdateAccessGranted { get; set; } = false;

        // Email update request status: "None", "Pending", "Approved", "Denied", "Completed"
        [BsonElement("emailUpdateRequestStatus")]
        public string EmailUpdateRequestStatus { get; set; } = "None";

        // Optional proposed new email address submitted with the request
        [BsonElement("requestedNewEmail")]
        public string? RequestedNewEmail { get; set; }

        // Optional reason provided by prosumer for changing email
        [BsonElement("emailUpdateRequestReason")]
        public string? EmailUpdateRequestReason { get; set; }

        // Timestamp when prosumer submitted email update request
        [BsonElement("emailUpdateRequestDate")]
        public DateTime? EmailUpdateRequestDate { get; set; }

        // Review notes or justification provided by Backoffice officer
        [BsonElement("emailUpdateReviewNotes")]
        public string? EmailUpdateReviewNotes { get; set; }

        // History of timestamps when email updates were performed (used for 24h rate limiting: max 3)
        [BsonElement("emailUpdateHistory")]
        public List<DateTime> EmailUpdateHistory { get; set; } = new List<DateTime>();

        // GPS Latitude of the prosumer's solar panel installation site (used for nearby nodes lookup)
        [BsonElement("installationLatitude")]
        public double? InstallationLatitude { get; set; }

        // GPS Longitude of the prosumer's solar panel installation site (used for nearby nodes lookup)
        [BsonElement("installationLongitude")]
        public double? InstallationLongitude { get; set; }

        // 6-digit OTP code for password reset verification
        [BsonElement("passwordResetOtp")]
        public string? PasswordResetOtp { get; set; }

        // Timestamp when password reset OTP expires (strictly 5 minutes from generation)
        [BsonElement("passwordResetOtpExpiry")]
        public DateTime? PasswordResetOtpExpiry { get; set; }

        // Flag indicating that OTP was successfully verified within the 5-minute window
        [BsonElement("passwordResetVerified")]
        public bool PasswordResetVerified { get; set; } = false;

        // Timestamp when record was created
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Timestamp when record was last updated
        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}