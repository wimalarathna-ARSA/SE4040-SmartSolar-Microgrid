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
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SmartSolarApi.Data;
using SmartSolarApi.DTOs;
using SmartSolarApi.Models;

namespace SmartSolarApi.Services
{
    public class AuthService
    {
        private readonly MongoDbContext _db;
        private readonly IConfiguration _config;
        private readonly EmailService _emailService;

        public AuthService(
            MongoDbContext db,
            IConfiguration config,
            EmailService emailService)
        {
            _db = db;
            _config = config;
            _emailService = emailService;
        }

        public async Task<(bool Success, string Message, UserResponseDto? User)> RegisterProsumerAsync(
            RegisterProsumerDto dto)
        {
            var existingByNic = await _db.UserDetails
                .Find(u => u.Nic.ToLower() == dto.Nic.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existingByNic != null)
            {
                return (false, "An account with this National Identity Card (NIC) already exists.", null);
            }

            var existingByEmail = await _db.UserDetails
                .Find(u => u.Email.ToLower() == dto.Email.Trim().ToLower())
                .FirstOrDefaultAsync();

            if (existingByEmail != null)
            {
                return (false, "An account with this email address already exists.", null);
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

        public async Task<(bool Success, string Message, AuthResponseDto? AuthData)> LoginAsync(
            LoginDto dto)
        {
            var identifier = dto.EmailOrNic.Trim();

            var user = await _db.UserDetails.Find(u =>
                u.Email.ToLower() == identifier.ToLower() ||
                u.Nic.ToLower() == identifier.ToLower()
            ).FirstOrDefaultAsync();

            if (user == null)
                return (false, "Invalid credentials. User not found.", null);

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return (false, "Invalid email/NIC or password.", null);

            if (user.Status == "PendingApproval")
                return (
                    false,
                    "Your account is pending Backoffice activation. Please contact system administrator.",
                    null
                );

            if (user.Status == "Deactivated")
                return (
                    false,
                    "This account is deactivated. Deactivated accounts can only be reactivated by a Backoffice officer.",
                    null
                );

            var token = GenerateJwtToken(user);

            return (
                true,
                "Authentication successful",
                new AuthResponseDto
                {
                    Token = token,
                    Nic = user.Nic,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    Status = user.Status,
                    Message = $"Login successful. Welcome {user.FullName}!"
                }
            );
        }

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

        /// <summary>
        /// Generates and sends a six-digit password reset OTP.
        /// </summary>
        public async Task<(bool Success, string Message, string? MaskedEmail)>
            RequestPasswordResetOtpAsync(RequestPasswordResetOtpDto dto)
        {
            var identifier = dto.EmailOrNic.Trim().ToLowerInvariant();

            var user = await _db.UserDetails.Find(u =>
                u.Email.ToLower() == identifier ||
                u.Nic.ToLower() == identifier
            ).FirstOrDefaultAsync();

            if (user == null)
            {
                return (
                    false,
                    "No account was found matching the provided Email or NIC.",
                    null
                );
            }

            var otp = RandomNumberGenerator
                .GetInt32(100000, 1000000)
                .ToString("D6");

            var now = DateTime.UtcNow;
            var expiry = now.AddMinutes(5);

            var update = Builders<UserDetails>.Update
                .Set(u => u.PasswordResetOtp, otp)
                .Set(u => u.PasswordResetOtpExpiry, expiry)
                .Set(u => u.PasswordResetVerified, false)
                .Set(u => u.UpdatedAt, now);

            await _db.UserDetails.UpdateOneAsync(
                u => u.Nic == user.Nic,
                update
            );

            await _emailService.SendPasswordResetOtpAsync(
                user.Email,
                user.FullName,
                otp
            );

            var masked = MaskEmail(user.Email);

            return (
                true,
                $"A 6-digit verification code has been dispatched to {masked}. Please enter it within 5 minutes.",
                masked
            );
        }

        private static string MaskEmail(string email)
        {
            if (string.IsNullOrEmpty(email) || !email.Contains('@'))
                return email;

            var parts = email.Split('@');
            var name = parts[0];
            var domain = parts[1];

            if (name.Length <= 2)
                return $"{name[0]}*@{domain}";

            return $"{name[0]}{new string('*', Math.Min(6, name.Length - 2))}{name[^1]}@{domain}";
        }
    }
}