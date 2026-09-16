// ============================================================================
// File: AuthDtos.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Data Transfer Objects for authentication, registration, and tokens.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    /// <summary>
    /// Request payload for Solar Prosumer registration using NIC as primary key.
    /// </summary>
    public class RegisterProsumerDto
    {
        // National Identity Card (NIC) - required primary unique identifier
        [Required]
        public string Nic { get; set; } = string.Empty;

        // Prosumer full name
        [Required]
        public string FullName { get; set; } = string.Empty;

        // Prosumer full name
        [Required]
        public string FullName { get; set; } = string.Empty;

        // Contact email
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        // Password with minimum security length
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        // Phone number
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        // Installation address
        public string Address { get; set; } = string.Empty;

        // Optional GPS Latitude of solar installation site
        public double? InstallationLatitude { get; set; }

        // Optional GPS Longitude of solar installation site
        public double? InstallationLongitude { get; set; }
    }

    /// <summary>
    /// Request payload for user login using Email or NIC.
    /// </summary>
    public class LoginDto
    {
        // Email or NIC identifier
        [Required]
        public string EmailOrNic { get; set; } = string.Empty;

        // Password
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response payload upon successful authentication.
    /// </summary>
    public class AuthResponseDto
    {
        // Signed JWT access token
        public string Token { get; set; } = string.Empty;

        // Prosumer NIC or staff identifier
        public string Nic { get; set; } = string.Empty;

        // User full name
        public string FullName { get; set; } = string.Empty;

        // User email
        public string Email { get; set; } = string.Empty;

        // Role: Backoffice, GridOperator, or Prosumer
        public string Role { get; set; } = string.Empty;

        // Account status
        public string Status { get; set; } = string.Empty;

        // Informational message
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload for Backoffice creation of Backoffice and Grid Operator staff.
    /// </summary>
    public class CreateStaffUserDto
    {
        // Staff NIC
        [Required]
        public string Nic { get; set; } = string.Empty;

        // Staff full name
        [Required]
        public string FullName { get; set; } = string.Empty;

        // Staff official email
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        // Password
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        // Role: must be "Backoffice" or "GridOperator"
        [Required]
        public string Role { get; set; } = "GridOperator";

        // Phone number
        public string PhoneNumber { get; set; } = string.Empty;

        // Address
        public string Address { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload to trigger a 6-digit OTP dispatch to user's registered Gmail address.
    /// </summary>
    public class RequestPasswordResetOtpDto
    {
        [Required]
        public string EmailOrNic { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload to verify the 6-digit OTP within the 5-minute window.
    /// </summary>
    public class VerifyPasswordResetOtpDto
    {
        [Required]
        public string EmailOrNic { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "OTP must be exactly 6 digits.")]
        public string Otp { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload to confirm new password after OTP verification.
    /// </summary>
    public class ConfirmPasswordResetDto
    {
        [Required]
        public string EmailOrNic { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string Otp { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}