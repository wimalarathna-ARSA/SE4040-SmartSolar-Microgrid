// ============================================================================
// File: MongoDbContext.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: MongoDB database context configuring the 4 collections required
//              by the SE4040 specification (UserDetails, SolarStationInfo,
//              EnergyBookingSlots, and EnergyReservation).
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarApi.Models;

namespace SmartSolarApi.Data
{
    /// <summary>
    /// Encapsulates connection and collection access for MongoDB.
    /// </summary>
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        /// <summary>
        /// Initializes MongoDB connection with configuration parameters and fallbacks.
        /// </summary>
        // Reads connection string and database name from configuration or environment
        public MongoDbContext(IConfiguration configuration)
        {
            // Resolve connection string from environment or application settings.
            var connectionString =
                Environment.GetEnvironmentVariable("MONGODB_URI");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    configuration["MongoDB:ConnectionString"];
            }

            // Local MongoDB fallback for development environments.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    "mongodb://localhost:27017";
            }

            // Resolve configured database name or use the SmartSolar default.
            var databaseName =
                configuration["MongoDB:DatabaseName"]
                ?? "SmartSolarMicrogrid";

            // Create MongoDB client and connect to the application database.
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        /// <summary>
        /// Collection 1: UserDetails.
        /// Stores Backoffice, Grid Operator, and Prosumer records with NIC.
        /// </summary>
        public IMongoCollection<UserDetails> UserDetails =>
            _database.GetCollection<UserDetails>("UserDetails");

        /// <summary>
        /// Collection 2: SolarStationInfo.
        /// Stores Microgrid node stations with GPS coordinates and battery specs.
        /// </summary>
        public IMongoCollection<SolarStationInfo> SolarStationInfo =>
            _database.GetCollection<SolarStationInfo>("SolarStationInfo");

        /// <summary>
        /// Collection 3: EnergyBookingSlots.
        /// Stores scheduled energy trading slots per microgrid hub.
        /// </summary>
        public IMongoCollection<EnergyBookingSlots> EnergyBookingSlots =>
            _database.GetCollection<EnergyBookingSlots>("EnergyBookingSlots");

        /// <summary>
        /// Collection 4: EnergyReservation.
        /// Stores power trading bookings, QR payloads, and transaction statuses.
        /// </summary>
        public IMongoCollection<EnergyReservation> EnergyReservation =>
            _database.GetCollection<EnergyReservation>("EnergyReservation");

        /// <summary>
        /// Helper accessor to underlying IMongoDatabase instance for administrative tasks.
        /// </summary>
        // Provides direct access to the MongoDB database instance
        public IMongoDatabase Database => _database;

        /// <summary>
        /// Migrates legacy ObjectId-backed user documents to NIC-backed _id values.
        /// The original collection is retained as a timestamped backup.
        /// </summary>
        public async Task EnsureUserDetailsNicPrimaryKeyAsync()
        {
            // Access UserDetails as raw BSON documents because the migration
            // changes the MongoDB _id field itself.
            var userCollection =
                _database.GetCollection<BsonDocument>("UserDetails");

            var documents =
                await userCollection
                    .Find(FilterDefinition<BsonDocument>.Empty)
                    .ToListAsync();

            // Stop when there are no users or when all documents already
            // use string-based identifiers.
            if (documents.Count == 0 ||
                documents.All(document =>
                    document.GetValue("_id").BsonType == BsonType.String))
            {
                return;
            }

            // Temporary collection used to build the migrated documents safely.
            var migrationCollectionName =
                "UserDetails_NicMigration";

            var existingCollections =
                await _database
                    .ListCollectionNames()
                    .ToListAsync();

            // Remove an incomplete migration collection from an earlier attempt.
            if (existingCollections.Contains(migrationCollectionName))
            {
                await _database.DropCollectionAsync(
                    migrationCollectionName);
            }

            var migratedDocuments =
                new List<BsonDocument>();

            var seenNics =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase);

            foreach (var document in documents)
            {
                // Every user must contain a string NIC before migration.
                if (!document.TryGetValue("nic", out var nicValue) ||
                    nicValue.BsonType != BsonType.String)
                {
                    throw new InvalidOperationException(
                        "Every UserDetails document must contain a string NIC before migration.");
                }

                // Normalize the NIC before using it as the MongoDB identifier.
                var nic =
                    nicValue.AsString
                        .Trim()
                        .ToUpperInvariant();

                // Prevent empty or duplicate NIC values from becoming primary keys.
                if (string.IsNullOrWhiteSpace(nic) ||
                    !seenNics.Add(nic))
                {
                    throw new InvalidOperationException(
                        "Every UserDetails document must contain a unique, non-empty NIC before migration.");
                }

                // Clone the existing document so the original collection
                // remains unchanged during the migration preparation stage.
                var migrated =
                    document
                        .DeepClone()
                        .AsBsonDocument;

                // Replace the legacy ObjectId with the NIC.
                migrated["_id"] = nic;

                // Keep the NIC field normalized as well.
                migrated["nic"] = nic;

                migratedDocuments.Add(migrated);
            }

            // Create the temporary migrated collection.
            var migrationCollection =
                _database.GetCollection<BsonDocument>(
                    migrationCollectionName);

            await migrationCollection.InsertManyAsync(
                migratedDocuments);

            // Preserve the original ObjectId collection as a timestamped backup.
            var backupCollectionName =
                $"UserDetails_ObjectIdBackup_{DateTime.UtcNow:yyyyMMddHHmmss}";

            // Rename the original collection before promoting the migrated data.
            await _database.RenameCollectionAsync(
                "UserDetails",
                backupCollectionName);

            // Promote the migrated collection to the official UserDetails name.
            await _database.RenameCollectionAsync(
                migrationCollectionName,
                "UserDetails");
        }
    }
}