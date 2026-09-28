// ============================================================================
// File: DbSeeder.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Automated database seeder that initializes the SmartSolar
//              application with default system users.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Driver;
using SmartSolarApi.Models;

namespace SmartSolarApi.Data
{
    /// <summary>
    /// Utility class for seeding default database state.
    /// </summary>
    public static class DbSeeder
    {
        /// <summary>
        /// Asynchronously seeds initial system users when the user collection is empty.
        /// </summary>
        // Checks whether the database has been initialized before inserting default records
        public static async Task SeedAsync(MongoDbContext db)
        {
            // Seed Users (Backoffice, Grid Operator, and Prosumers)
            var userCount = await db.UserDetails.CountDocumentsAsync(_ => true);

            if (userCount == 0)
            {
                var adminUser = new UserDetails
                {
                    Nic = "198512345678",
                    FullName = "Chief Backoffice Administrator",
                    Email = "admin@smartsolar.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "Backoffice",
                    PhoneNumber = "+94771234567",
                    Address = "Microgrid Headquarters, Colombo 03",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var operatorUser = new UserDetails
                {
                    Nic = "199087654321",
                    FullName = "Senior Grid Operator",
                    Email = "operator@smartsolar.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Operator@123"),
                    Role = "GridOperator",
                    PhoneNumber = "+94772345678",
                    Address = "Grid Operations Control Center, Colombo 02",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var prosumerActive = new UserDetails
                {
                    Nic = "199512345678",
                    FullName = "Kamal Perera (Solar Home Owner)",
                    Email = "kamal@solar.lk",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Kamal@123"),
                    Role = "Prosumer",
                    PhoneNumber = "+94773456789",
                    Address = "45 High Level Road, Maharagama",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var prosumerPending = new UserDetails
                {
                    Nic = "199623456789",
                    FullName = "Nimal Silva (New Applicant)",
                    Email = "nimal@solar.lk",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Nimal@123"),
                    Role = "Prosumer",
                    PhoneNumber = "+94774567890",
                    Address = "12 Station Road, Kandy",
                    Status = "PendingApproval",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await db.UserDetails.InsertManyAsync(
                    new[]
                    {
                        adminUser,
                        operatorUser,
                        prosumerActive,
                        prosumerPending
                    });
            }
        }
    }
}