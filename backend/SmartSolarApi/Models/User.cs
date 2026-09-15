// ============================================================================
// File: User.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Legacy domain entity model for a generic system user.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarApi.Models
{
    /// <summary>
    /// Basic user entity mapped to the MongoDB Users collection.
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
    }
}