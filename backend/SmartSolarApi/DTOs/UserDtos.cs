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

    /// <summary>
    /// Detailed user response representation.
    /// </summary>
    public class UserResponseDto
    {
        // MongoDB document ID
        public string Id { get; set; } = string.Empty;

        // NIC primary key
        public string Nic { get; set; } = string.Empty;

        // User full name
        public string FullName { get; set; } = string.Empty;

        // Email address
        public string Email { get; set; } = string.Empty;

        // Role: Backoffice, GridOperator, Prosumer
        public string Role { get; set; } = string.Empty;

        // Phone number
        public string PhoneNumber { get; set; } = string.Empty;

        // Address
        public string Address { get; set; } = string.Empty;

        // Account lifecycle status
        public string Status { get; set; } = string.Empty;

        // Flag indicating pending deactivation request
        public bool DeactivationRequested { get; set; }

        // Reason submitted for deactivation
        public string? DeactivationReason { get; set; }

        // Flag indicating whether Backoffice has granted email change access
        public bool EmailUpdateAccessGranted { get; set; }

        // Status of email update request: None, Pending, Approved, Denied, Completed
        public string EmailUpdateRequestStatus { get; set; } = "None";

        // Desired new email requested by prosumer
        public string? RequestedNewEmail { get; set; }

        // Reason submitted for email change request
        public string? EmailUpdateRequestReason { get; set; }

        // Date of email change request
        public DateTime? EmailUpdateRequestDate { get; set; }

        // Notes from Backoffice review
        public string? EmailUpdateReviewNotes { get; set; }

        // Number of email updates executed within the past 24 hours
        public int EmailUpdatesLast24Hours { get; set; }

        // Remaining updates permitted within the current 24-hour rolling window (Max 3)
        public int EmailUpdatesRemaining24Hours { get; set; }

        // GPS Latitude of solar installation site (nullable — set during/after registration)
        public double? InstallationLatitude { get; set; }

        // GPS Longitude of solar installation site (nullable — set during/after registration)
        public double? InstallationLongitude { get; set; }

        // Date of account creation
        public DateTime CreatedAt { get; set; }
    }
}