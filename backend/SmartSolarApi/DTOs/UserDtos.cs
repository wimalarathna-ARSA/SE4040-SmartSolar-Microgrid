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
    /// Request payload for Backoffice to update account status.
    /// </summary>
    public class ChangeAccountStatusDto
    {
        [Required]
        public string Status { get; set; } = "Active";

        public string? Note { get; set; }
    }

    /// <summary>
    /// Request payload for prosumer to request email update access from Backoffice.
    /// </summary>
    public class RequestEmailUpdateDto
    {
        // Optional proposed new email address
        [EmailAddress]
        public string? RequestedNewEmail { get; set; }

        // Optional reason/justification for email modification
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Request payload for Backoffice officer to accept or deny an email update request.
    /// </summary>
    public class ReviewEmailUpdateDto
    {
        // Action: "Accept" (grant access) or "Deny"
        [Required]
        public string Action { get; set; } = "Accept";

        // Optional audit/review note from the officer
        public string? Note { get; set; }
    }

    /// <summary>
    /// Request payload for prosumer to execute email update once access is granted.
    /// </summary>
    public class ExecuteEmailUpdateDto
    {
        // The new email address
        [Required]
        [EmailAddress]
        public string NewEmail { get; set; } = string.Empty;
    }

    /// <summary>
    /// Representation of a pending or past email update request for Backoffice dashboard.
    /// </summary>
    public class EmailUpdateRequestSummaryDto
    {
        public string Nic { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;

        public string CurrentEmail { get; set; } = string.Empty;

        public string? RequestedNewEmail { get; set; }

        public string? Reason { get; set; }

        public DateTime? RequestDate { get; set; }

        public string Status { get; set; } = string.Empty;

        public bool AccessGranted { get; set; }

        public string? ReviewNotes { get; set; }

        public int UpdatesLast24Hours { get; set; }

        public int UpdatesRemaining24Hours { get; set; }
    }
}