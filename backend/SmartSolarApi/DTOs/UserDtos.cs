// ============================================================================
// File: UserDtos.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Data Transfer Objects for user profiles and account management.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartSolarApi.DTOs
{
    /// <summary>
    /// Request payload for a prosumer to update their personal profile.
    /// </summary>
    public class UpdateProfileDto
    {
        // Updated full name
        [Required]
        public string FullName { get; set; } = string.Empty;

        // Updated contact telephone number
        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        // Updated physical/solar location address
        public string Address { get; set; } = string.Empty;

        // Optional updated GPS Latitude of solar installation site
        public double? InstallationLatitude { get; set; }

        // Optional updated GPS Longitude of solar installation site
        public double? InstallationLongitude { get; set; }
    }

    /// <summary>
    /// Request payload for a prosumer to request account deactivation.
    /// </summary>
    public class DeactivationRequestDto
    {
        // Reason for requesting deactivation
        [Required]
        public string Reason { get; set; } = string.Empty;
    }
}