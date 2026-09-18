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
            // Resolve connection string from environment or appsettings with localhost fallback
            var connectionString = Environment.GetEnvironmentVariable("MONGODB_URI");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = configuration["MongoDB:ConnectionString"];
            }
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = "mongodb://localhost:27017";
            }

            var databaseName = configuration["MongoDB:DatabaseName"] ?? "SmartSolarMicrogrid";

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        /// <summary>
        /// Collection 1: User's detail (UserDetails).
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
        /// Helper accessor to underlying IMongoDatabase instance for admin tasks.
        /// </summary>
        // Provides direct access to the MongoDB database instance
        public IMongoDatabase Database => _database;

        /// <summary>
        /// Migrates legacy ObjectId-backed user documents to NIC-backed _id values.
        /// The legacy collection is retained as a timestamped backup.
        /// </summary>
        public async Task EnsureUserDetailsNicPrimaryKeyAsync()
        {
            var userCollection = _database.GetCollection<BsonDocument>("UserDetails");
            var documents = await userCollection.Find(FilterDefinition<BsonDocument>.Empty).ToListAsync();

            if (documents.Count == 0 || documents.All(document => document.GetValue("_id").BsonType == BsonType.String))
            {
                return;
            }

            var migrationCollectionName = "UserDetails_NicMigration";
            var existingCollections = await _database.ListCollectionNames().ToListAsync();
            if (existingCollections.Contains(migrationCollectionName))
            {
                await _database.DropCollectionAsync(migrationCollectionName);
            }

            var migratedDocuments = new List<BsonDocument>();
            var seenNics = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var document in documents)
            {
                if (!document.TryGetValue("nic", out var nicValue) || nicValue.BsonType != BsonType.String)
                {
                    throw new InvalidOperationException("Every UserDetails document must contain a string NIC before migration.");
                }

                var nic = nicValue.AsString.Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(nic) || !seenNics.Add(nic))
                {
                    throw new InvalidOperationException("Every UserDetails document must contain a unique, non-empty NIC before migration.");
                }

                var migrated = document.DeepClone().AsBsonDocument;
                migrated["_id"] = nic;
                migrated["nic"] = nic;
                migratedDocuments.Add(migrated);
            }

            var migrationCollection = _database.GetCollection<BsonDocument>(migrationCollectionName);
            await migrationCollection.InsertManyAsync(migratedDocuments);

            var backupCollectionName = $"UserDetails_ObjectIdBackup_{DateTime.UtcNow:yyyyMMddHHmmss}";
            await _database.RenameCollectionAsync("UserDetails", backupCollectionName);
            await _database.RenameCollectionAsync(migrationCollectionName, "UserDetails");
        }
    }
}