// ============================================================================
// File: MongoDbContext.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: MongoDB database context configuring the 4 collections required
//              by the SE4040 specification (UserDetails, SolarStationInfo,
//              EnergyBookingSlots, and EnergyReservation).
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

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
            // Resolve MongoDB connection string from the environment.
            var connectionString =
                Environment.GetEnvironmentVariable("MONGODB_URI");

            // Fall back to application configuration.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    configuration["MongoDB:ConnectionString"];
            }

            // Use localhost MongoDB when no external connection is configured.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    "mongodb://localhost:27017";
            }

            // Resolve configured SmartSolar database name.
            var databaseName =
                configuration["MongoDB:DatabaseName"]
                ?? "SmartSolarMicrogrid";

            // Initialize MongoDB client and database.
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
        /// Stores Microgrid node stations with GPS coordinates and battery specifications.
        /// </summary>
        public IMongoCollection<SolarStationInfo> SolarStationInfo =>
            _database.GetCollection<SolarStationInfo>("SolarStationInfo");

        /// <summary>
        /// Collection 3: EnergyBookingSlots.
        /// Stores scheduled energy trading slots for each microgrid hub.
        /// </summary>
        public IMongoCollection<EnergyBookingSlots> EnergyBookingSlots =>
            _database.GetCollection<EnergyBookingSlots>("EnergyBookingSlots");

        /// <summary>
        /// Collection 4: EnergyReservation.
        /// Stores energy trading bookings, QR payloads, and transaction statuses.
        /// </summary>
        public IMongoCollection<EnergyReservation> EnergyReservation =>
            _database.GetCollection<EnergyReservation>("EnergyReservation");

        /// <summary>
        /// Provides direct access to the underlying MongoDB database instance.
        /// This is useful for administrative and migration operations.
        /// </summary>
        // Exposes the database instance for controlled administrative database operations
        public IMongoDatabase Database => _database;
    }
}