// ============================================================================
// File: UserDtos.cs
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Data Transfer Objects for user profiles, status updates,
//              and prosumer account deactivation/reactivation.
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
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public double? InstallationLatitude { get; set; }

        public double? InstallationLongitude { get; set; }
    }

    /// <summary>
    /// Request payload for a prosumer to request account deactivation.
    /// </summary>
    public class DeactivationRequestDto
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload for Backoffice to update account status (Activate / Deactivate).
    /// </summary>
    public class ChangeAccountStatusDto
    {
        // Target status: "Active" or "Deactivated"
        [Required]
        public string Status { get; set; } = "Active";

        // Admin audit notes
        public string? Note { get; set; }
    }
}