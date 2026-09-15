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
        [Required]
        public string Nic { get; set; } = string.Empty;

        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload for user login using Email or NIC.
    /// </summary>
    public class LoginDto
    {
        [Required]
        public string EmailOrNic { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response payload upon successful authentication.
    /// </summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Nic { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
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
}