// ============================================================================
// File: AuthService.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Authentication and authorization service. Handles prosumer
//              registration using NIC as primary key, role-based login,
//              and secure JWT issuance.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    /// <summary>
    /// Service layer handling user authentication, credential verification,
    /// and token issuance.
    /// </summary>
    public class AuthService
    {
        private readonly MongoDbContext _db;
        private readonly IConfiguration _config;

        public AuthService(MongoDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        /// <summary>
        /// Registers a new Solar Prosumer with NIC as the unique business primary key.
        /// </summary>
        public async Task<(bool Success, string Message, UserResponseDto? User)> RegisterProsumerAsync(
            RegisterProsumerDto dto)
        {
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

        /// <summary>
        /// Authenticates users via Email or NIC and password.
        /// </summary>
        public async Task<(bool Success, string Message, AuthResponseDto? AuthData)> LoginAsync(
            LoginDto dto)
        {
            var identifier = dto.EmailOrNic.Trim();

            var user = await _db.UserDetails.Find(u =>
                u.Email.ToLower() == identifier.ToLower() ||
                u.Nic.ToLower() == identifier.ToLower()
            ).FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, "Invalid credentials. User not found.", null);
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return (false, "Invalid email/NIC or password.", null);
            }

            if (user.Status == "PendingApproval")
            {
                return (
                    false,
                    "Your account is pending Backoffice activation. Please contact system administrator.",
                    null
                );
            }

            if (user.Status == "Deactivated")
            {
                return (
                    false,
                    "This account is deactivated. Deactivated accounts can only be reactivated by a Backoffice officer.",
                    null
                );
            }

            var token = GenerateJwtToken(user);

            var authResponse = new AuthResponseDto
            {
                Token = token,
                Nic = user.Nic,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Status = user.Status,
                Message = $"Login successful. Welcome {user.FullName}!"
            };

            return (true, "Authentication successful", authResponse);
        }

        /// <summary>
        /// Generates signed JWT bearer token containing user identity and role claims.
        /// </summary>
        public string GenerateJwtToken(UserDetails user)
        {
            var jwtKey = _config["Jwt:Key"]
                ?? "SmartSolarSecretKey2026SuperSecureMicrogridEnterpriseSystemToken12345!";

            var issuer = _config["Jwt:Issuer"] ?? "SmartSolarApi";
            var audience = _config["Jwt:Audience"] ?? "SmartSolarClients";

            var expiryMinutes =
                int.TryParse(_config["Jwt:ExpiryMinutes"], out var exp)
                    ? exp
                    : 1440;

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Nic),
                new Claim(ClaimTypes.NameIdentifier, user.Nic),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("nic", user.Nic),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("status", user.Status)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}