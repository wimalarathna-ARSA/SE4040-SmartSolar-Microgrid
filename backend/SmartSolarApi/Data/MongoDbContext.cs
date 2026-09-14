// ============================================================================
// File: MongoDbContext.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: MongoDB database context configuring the four collections
//              required by the SmartSolar Microgrid Trading System.
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
            // Resolve connection string from environment first.
            var connectionString =
                Environment.GetEnvironmentVariable("MONGODB_URI");

            // Fall back to appsettings configuration.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    configuration["MongoDB:ConnectionString"];
            }

            // Use localhost MongoDB for local development when no configuration exists.
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString =
                    "mongodb://localhost:27017";
            }

            // Resolve the SmartSolar database name.
            var databaseName =
                configuration["MongoDB:DatabaseName"]
                ?? "SmartSolarMicrogrid";

            // Create MongoDB client and select the configured database.
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        /// <summary>
        /// Collection 1: UserDetails.
        /// Stores Backoffice, Grid Operator, and Prosumer records.
        /// </summary>
        public IMongoCollection<UserDetails> UserDetails =>
            _database.GetCollection<UserDetails>("UserDetails");

        /// <summary>
        /// Collection 2: SolarStationInfo.
        /// Stores microgrid stations with GPS coordinates and battery information.
        /// </summary>
        public IMongoCollection<SolarStationInfo> SolarStationInfo =>
            _database.GetCollection<SolarStationInfo>("SolarStationInfo");

        /// <summary>
        /// Collection 3: EnergyBookingSlots.
        /// Stores scheduled energy trading slots for microgrid stations.
        /// </summary>
        public IMongoCollection<EnergyBookingSlots> EnergyBookingSlots =>
            _database.GetCollection<EnergyBookingSlots>("EnergyBookingSlots");

        /// <summary>
        /// Collection 4: EnergyReservation.
        /// Stores energy trading reservations and transaction information.
        /// </summary>
        public IMongoCollection<EnergyReservation> EnergyReservation =>
            _database.GetCollection<EnergyReservation>("EnergyReservation");
    }
}