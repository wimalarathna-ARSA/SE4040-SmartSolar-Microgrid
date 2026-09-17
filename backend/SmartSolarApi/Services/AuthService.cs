// ============================================================================
// File: AuthService.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Authentication and authorization service. Handles prosumer
//              registration using NIC as primary key.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service layer handling user authentication and registration.
    /// </summary>
    public class AuthService
    {
        private readonly MongoDbContext _db;

        public AuthService(MongoDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Registers a new Solar Prosumer with NIC as the unique business primary key.
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> RegisterProsumerAsync(
            RegisterProsumerDto dto)
        {
            // Validate NIC uniqueness
            var existingByNic = await _db.UserDetails
                .Find(u => u.Nic.ToLower() == dto.Nic.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existingByNic != null)
            {
                return (
                    false,
                    "An account with this National Identity Card (NIC) already exists.",
                    null
                );
            }

            // Validate email uniqueness
            var existingByEmail = await _db.UserDetails
                .Find(u => u.Email.ToLower() == dto.Email.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existingByEmail != null)
            {
                return (
                    false,
                    "An account with this email address already exists.",
                    null
                );
            }

            // Create new prosumer entity
            var prosumer = new UserDetails
            {
                Nic = dto.Nic.Trim().ToUpperInvariant(),
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Prosumer",
                PhoneNumber = dto.PhoneNumber.Trim(),
                Address = dto.Address.Trim(),
                InstallationLatitude = dto.InstallationLatitude,
                InstallationLongitude = dto.InstallationLongitude,
                Status = "PendingApproval",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _db.UserDetails.InsertOneAsync(prosumer);

            var userDto = new UserResponseDto
            {
                Id = prosumer.Nic,
                Nic = prosumer.Nic,
                FullName = prosumer.FullName,
                Email = prosumer.Email,
                Role = prosumer.Role,
                PhoneNumber = prosumer.PhoneNumber,
                Address = prosumer.Address,
                Status = prosumer.Status,
                CreatedAt = prosumer.CreatedAt
            };

            return (
                true,
                "Prosumer account registered successfully. Awaiting Backoffice officer activation.",
                userDto
            );
        }
    }
}