// ============================================================================
// File: MongoDbContext.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: MongoDB database context responsible for establishing the
//              application database connection.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Driver;

namespace SmartSolarApi.Data
{
    /// <summary>
    /// Encapsulates the MongoDB database connection.
    /// </summary>
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        /// <summary>
        /// Initializes the MongoDB connection using application configuration
        /// and environment variables.
        /// </summary>
        // Resolves MongoDB connection settings with environment and local fallbacks
        public MongoDbContext(IConfiguration configuration)
        {
            // First attempt to read the MongoDB connection from the environment.
            var connectionString = Environment.GetEnvironmentVariable("MONGODB_URI");

            // Fall back to application configuration when the environment variable
            // is not available.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = configuration["MongoDB:ConnectionString"];
            }

            // Use local MongoDB installation as the development fallback.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = "mongodb://localhost:27017";
            }

            // Read configured database name or use the SmartSolar default.
            var databaseName =
                configuration["MongoDB:DatabaseName"]
                ?? "SmartSolarMicrogrid";

            // Create MongoDB client and select the application database.
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }
    }
}