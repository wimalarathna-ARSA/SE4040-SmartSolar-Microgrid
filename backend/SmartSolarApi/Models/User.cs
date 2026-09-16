// ============================================================================
// File: User.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Legacy domain entity model for a generic system user.
//              Superseded by the full UserDetails model which supports NIC-based
//              primary keys, role-based access, and prosumer lifecycle management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Legacy user entity for basic user authentication data.
    /// Maps to the 'Users' MongoDB collection (superseded by UserDetails).
    /// </summary>
    public class User
    {
        // Unique MongoDB ObjectId for this user document
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        // Display name of the user
        public string Name { get; set; } = string.Empty;

        // Unique email address used for authentication
        public string Email { get; set; } = string.Empty;

        // BCrypt-hashed password for secure credential storage
        public string PasswordHash { get; set; } = string.Empty;

        // Role assigned to the user: "Customer", "Admin", etc.
        public string Role { get; set; } = "Customer";

        // UTC timestamp when this user record was created
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}