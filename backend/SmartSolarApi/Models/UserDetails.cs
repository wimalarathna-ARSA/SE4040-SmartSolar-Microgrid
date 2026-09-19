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

        // Role: "Backoffice", "GridOperator", or "Prosumer"
        [BsonElement("role")]
        public string Role { get; set; } = "Prosumer";

        [BsonElement("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

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
    }
}