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
    /// Service layer handling user authentication, credential verification, and token issuance.
    /// </summary>
    public class AuthService
    {
        private readonly MongoDbContext _db;
        private readonly IConfiguration _config;
        private readonly EmailService _emailService;

        /// <summary>
        /// Constructor injecting database context, configuration, and email service.
        /// </summary>
        // Injects MongoDbContext, configuration settings, and EmailService for OTP transmission
        public AuthService(MongoDbContext db, IConfiguration config, EmailService emailService)
        {
            // Injects database context, configuration settings, and email service for auth workflows
            _db = db;
            _config = config;
            _emailService = emailService;
        }

        /// <summary>
        /// Registers a new Solar Prosumer with NIC as the unique business primary key.
        /// </summary>
        // Validates unique NIC and email, hashes password, and creates account with PendingApproval or Active status
        public async Task<(bool Success, string Message, UserResponseDto? User)> RegisterProsumerAsync(RegisterProsumerDto dto)
        {
            // Enforce unique NIC and email, hash password, and register pending prosumer
            var existingByNic = await _db.UserDetails.Find(u => u.Nic.ToLower() == dto.Nic.Trim().ToLower()).FirstOrDefaultAsync();
            if (existingByNic != null)
            {
                return (false, "An account with this National Identity Card (NIC) already exists.", null);
            }

            // Check email uniqueness
            var existingByEmail = await _db.UserDetails.Find(u => u.Email.ToLower() == dto.Email.Trim().ToLower()).FirstOrDefaultAsync();
            if (existingByEmail != null)
            {
                return (false, "An account with this email address already exists.", null);
            }

            // Create new prosumer entity with initial PendingApproval status
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
                Status = "PendingApproval", // Requires Backoffice approval per rubric workflow
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

            return (true, "Prosumer account registered successfully. Awaiting Backoffice officer activation.", userDto);
        }

        /// <summary>
        /// Authenticates users (Backoffice, Operator, Prosumer) via Email or NIC and password.
        /// </summary>
        // Validates credentials, checks account active status, and returns signed JWT
        public async Task<(bool Success, string Message, AuthResponseDto? AuthData)> LoginAsync(LoginDto dto)
        {
            // Verify user credentials by email or NIC, validate account status, and issue JWT bearer token
            var identifier = dto.EmailOrNic.Trim();

            // Locate user by Email or NIC
            var user = await _db.UserDetails.Find(u => 
                u.Email.ToLower() == identifier.ToLower() || 
                u.Nic.ToLower() == identifier.ToLower()).FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, "Invalid credentials. User not found.", null);
            }

            // Verify password hash
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return (false, "Invalid email/NIC or password.", null);
            }

            // Business rule: Check account status
            if (user.Status == "PendingApproval")
            {
                return (false, "Your account is pending Backoffice activation. Please contact system administrator.", null);
            }

            if (user.Status == "Deactivated")
            {
                return (false, "This account is deactivated. Deactivated accounts can only be reactivated by a Backoffice officer.", null);
            }

            // Generate JWT Token
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
        // Assembles claims (Sub, Email, NIC, Role) and signs with HMAC-SHA256
        public string GenerateJwtToken(UserDetails user)
        {
            // Build JWT claims identity with user role and sign using HMAC-SHA256 security key
            var jwtKey = _config["Jwt:Key"] ?? "SmartSolarSecretKey2026SuperSecureMicrogridEnterpriseSystemToken12345!";
            var issuer = _config["Jwt:Issuer"] ?? "SmartSolarApi";
            var audience = _config["Jwt:Audience"] ?? "SmartSolarClients";
            var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var exp) ? exp : 1440;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

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
        /// Initiates the Password Reset workflow by generating a 6-digit cryptographic OTP,
        /// storing it with a strict 5-minute expiration timestamp, and dispatching it to user's registered Gmail.
        /// </summary>
        public async Task<(bool Success, string Message, string? MaskedEmail)> RequestPasswordResetOtpAsync(RequestPasswordResetOtpDto dto)
        {
            // Generate 6-digit numeric OTP with 5-minute expiry, save to database, and dispatch via email
            var identifier = dto.EmailOrNic.Trim().ToLowerInvariant();
            var user = await _db.UserDetails.Find(u => 
                u.Email.ToLower() == identifier || 
                u.Nic.ToLower() == identifier).FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, "No account was found matching the provided Email or NIC.", null);
            }

            // Generate cryptographically secure 6-digit numeric OTP
            var otp = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
            var now = DateTime.UtcNow;
            var expiry = now.AddMinutes(5); // Strictly 5 minutes expiration

            var update = Builders<UserDetails>.Update
                .Set(u => u.PasswordResetOtp, otp)
                .Set(u => u.PasswordResetOtpExpiry, expiry)
                .Set(u => u.PasswordResetVerified, false)
                .Set(u => u.UpdatedAt, now);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);

            // Send via Gmail SMTP (or fallback logger)
            await _emailService.SendPasswordResetOtpAsync(user.Email, user.FullName, otp);

            var masked = MaskEmail(user.Email);
            return (true, $"A 6-digit verification code has been dispatched to {masked}. Please enter it within 5 minutes.", masked);
        }

        /// <summary>
        /// Verifies that the submitted 6-digit OTP matches the stored code and has not exceeded the 5-minute window.
        /// </summary>
        public async Task<(bool Success, string Message)> VerifyPasswordResetOtpAsync(VerifyPasswordResetOtpDto dto)
        {
            // Validate submitted 6-digit OTP against database record and verify 5-minute expiration window
            var identifier = dto.EmailOrNic.Trim().ToLowerInvariant();
            var user = await _db.UserDetails.Find(u => 
                u.Email.ToLower() == identifier || 
                u.Nic.ToLower() == identifier).FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, "Account not found.");
            }

            if (string.IsNullOrEmpty(user.PasswordResetOtp) || !user.PasswordResetOtpExpiry.HasValue)
            {
                return (false, "No active password reset request found. Please request a new verification code.");
            }

            if (DateTime.UtcNow > user.PasswordResetOtpExpiry.Value)
            {
                return (false, "This verification code has expired (strictly valid for 5 minutes). Please request a new code.");
            }

            if (!string.Equals(user.PasswordResetOtp.Trim(), dto.Otp.Trim(), StringComparison.Ordinal))
            {
                return (false, "Invalid verification code. Please check your email and try again.");
            }

            // Mark as verified
            await _db.UserDetails.UpdateOneAsync(
                u => u.Nic == user.Nic,
                Builders<UserDetails>.Update
                    .Set(u => u.PasswordResetVerified, true)
                    .Set(u => u.UpdatedAt, DateTime.UtcNow));

            return (true, "Verification code confirmed! Please enter and confirm your new password.");
        }

        /// <summary>
        /// Finalizes the password reset by validating passwords, verifying the OTP state,
        /// hashing the new password with BCrypt, and clearing the OTP security fields.
        /// </summary>
        public async Task<(bool Success, string Message)> ConfirmPasswordResetAsync(ConfirmPasswordResetDto dto)
        {
            // Validate password requirements, check verified OTP status, hash new password, and clear reset tokens
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            {
                return (false, "Password must be at least 6 characters long.");
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return (false, "New password and confirmation password do not match.");
            }

            var identifier = dto.EmailOrNic.Trim().ToLowerInvariant();
            var user = await _db.UserDetails.Find(u => 
                u.Email.ToLower() == identifier || 
                u.Nic.ToLower() == identifier).FirstOrDefaultAsync();

            if (user == null)
            {
                return (false, "Account not found.");
            }

            if (!user.PasswordResetVerified || string.IsNullOrEmpty(user.PasswordResetOtp))
            {
                return (false, "Security verification incomplete. Please enter and verify your OTP first.");
            }

            if (!user.PasswordResetOtpExpiry.HasValue || DateTime.UtcNow > user.PasswordResetOtpExpiry.Value)
            {
                return (false, "Your verification session has expired (5-minute limit). Please request a new code.");
            }

            if (!string.Equals(user.PasswordResetOtp.Trim(), dto.Otp.Trim(), StringComparison.Ordinal))
            {
                return (false, "Invalid verification code token.");
            }

            // Update password with BCrypt and clear OTP fields
            var newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword.Trim());
            var update = Builders<UserDetails>.Update
                .Set(u => u.PasswordHash, newHash)
                .Set(u => u.PasswordResetOtp, null)
                .Set(u => u.PasswordResetOtpExpiry, null)
                .Set(u => u.PasswordResetVerified, false)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            await _db.UserDetails.UpdateOneAsync(u => u.Nic == user.Nic, update);

            return (true, "Your password has been successfully reset! You can now log in with your new password.");
        }

        /// <summary>
        /// Masks an email address for safe client display (e.g. prosumer@gmail.com -> p******r@gmail.com).
        /// </summary>
        private static string MaskEmail(string email)
        {
            // Obfuscate local portion of email address to protect prosumer privacy on display
            if (string.IsNullOrEmpty(email) || !email.Contains('@')) return email;
            var parts = email.Split('@');
            var name = parts[0];
            var domain = parts[1];

            if (name.Length <= 2)
            {
                return $"{name[0]}*@{domain}";
            }

            return $"{name[0]}{new string('*', Math.Min(6, name.Length - 2))}{name[^1]}@{domain}";
        }
    }
}