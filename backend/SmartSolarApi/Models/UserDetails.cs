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

        // Contact phone number
        [BsonElement("phoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;

        // Physical address / solar installation address
        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;
    }
}