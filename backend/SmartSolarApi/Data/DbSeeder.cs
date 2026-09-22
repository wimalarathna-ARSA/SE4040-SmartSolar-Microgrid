// ============================================================================
// File: DbSeeder.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Automated database seeder that populates initial Backoffice admin,
//              Grid Operator, sample Solar Prosumers, Microgrid Stations, and 
//              Energy Booking Slots if the database is uninitialized.
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
        /// Asynchronously seeds all required collections with sample data if empty.
        /// </summary>
        // Inline comment: Evaluates collections count and creates initial records
        public static async Task SeedAsync(MongoDbContext db)
        {
            // Seed Users (Backoffice, Operator, Prosumers)
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

                await db.UserDetails.InsertManyAsync(new[] { adminUser, operatorUser, prosumerActive, prosumerPending });
            }

            // Seed Microgrid Solar Hubs
            var stationCount = await db.SolarStationInfo.CountDocumentsAsync(_ => true);
            if (stationCount == 0)
            {
                var stations = new List<SolarStationInfo>
                {
                    new SolarStationInfo
                    {
                        StationCode = "HUB-COLOMBO-01",
                        Name = "Colombo Central Solar Hub",
                        Location = "Union Place, Colombo 02",
                        Latitude = 6.9175,
                        Longitude = 79.8654,
                        CapacityKWh = 250.0,
                        TotalBatterySlots = 20,
                        AvailableBatterySlots = 14,
                        OperationalSchedule = "Mon-Sun 06:00-22:00",
                        Status = "Active"
                    },
                    new SolarStationInfo
                    {
                        StationCode = "HUB-KANDY-02",
                        Name = "Kandy Hill Microgrid Hub",
                        Location = "Peradeniya Road, Kandy",
                        Latitude = 7.2906,
                        Longitude = 80.6337,
                        CapacityKWh = 180.0,
                        TotalBatterySlots = 15,
                        AvailableBatterySlots = 11,
                        OperationalSchedule = "Mon-Sat 06:00-20:00",
                        Status = "Active"
                    },
                    new SolarStationInfo
                    {
                        StationCode = "HUB-GALLE-03",
                        Name = "Galle Coastal Solar Station",
                        Location = "Matara Road, Galle",
                        Latitude = 6.0535,
                        Longitude = 80.2210,
                        CapacityKWh = 300.0,
                        TotalBatterySlots = 25,
                        AvailableBatterySlots = 20,
                        OperationalSchedule = "Mon-Sun 07:00-21:00",
                        Status = "Active"
                    },
                    new SolarStationInfo
                    {
                        StationCode = "HUB-JAFFNA-04",
                        Name = "Jaffna Peninsula Solar Array",
                        Location = "Hospital Road, Jaffna",
                        Latitude = 9.6615,
                        Longitude = 80.0255,
                        CapacityKWh = 350.0,
                        TotalBatterySlots = 30,
                        AvailableBatterySlots = 27,
                        OperationalSchedule = "Mon-Sun 06:00-22:00",
                        Status = "Active"
                    }
                };

                await db.SolarStationInfo.InsertManyAsync(stations);

                // Seed discrete booking slots for stations over next 7 days
                var slots = new List<EnergyBookingSlots>();
                foreach (var station in stations)
                {
                    for (int day = 0; day < 7; day++)
                    {
                        var baseDate = DateTime.UtcNow.Date.AddDays(day);
                        int[] startHours = { 8, 10, 12, 14, 16, 18 };
                        foreach (var hour in startHours)
                        {
                            slots.Add(new EnergyBookingSlots
                            {
                                StationId = station.Id!,
                                StationName = station.Name,
                                SlotStartTime = baseDate.AddHours(hour),
                                SlotEndTime = baseDate.AddHours(hour + 2),
                                MaxCapacityKWh = 50.0,
                                AvailableCapacityKWh = 50.0,
                                PricePerKWh = 45.50m,
                                Status = "Available",
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                await db.EnergyBookingSlots.InsertManyAsync(slots);
            }

            // Seed Sample Energy Reservations
            var resCount = await db.EnergyReservation.CountDocumentsAsync(_ => true);
            if (resCount == 0)
            {
                var firstStation = await db.SolarStationInfo.Find(_ => true).FirstOrDefaultAsync();
                if (firstStation != null)
                {
                    var sampleReservation = new EnergyReservation
                    {
                        ReservationCode = "RES-" + new Random().Next(10000, 99999),
                        ProsumerNic = "199512345678",
                        ProsumerName = "Kamal Perera (Solar Home Owner)",
                        StationId = firstStation.Id!,
                        StationName = firstStation.Name,
                        SlotId = string.Empty,
                        ScheduledDateTime = DateTime.UtcNow.AddDays(2).Date.AddHours(14),
                        DurationHours = 2,
                        EnergyAmountKWh = 25.0,
                        TotalCost = 1137.50m,
                        ReservationType = "DropOff",
                        Status = "Approved",
                        QrCodeData = $"SMART-SOLAR-TOKEN:{firstStation.Id}:199512345678:{DateTime.UtcNow.AddDays(2):yyyyMMddHHmmss}",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await db.EnergyReservation.InsertOneAsync(sampleReservation);
                }
            }
        }
    }
}