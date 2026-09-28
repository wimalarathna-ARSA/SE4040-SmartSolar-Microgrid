// ============================================================================
// File: PasswordValidator.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Client-side strong password validation utility checking 5 industry standard security criteria.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.util;

import java.util.regex.Pattern;

/**
 * Client-side Strong Password Validator.
 * Evaluates 5 industry standard security criteria:
 * 1. Minimum 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one digit (0-9)
 * 5. At least one special symbol (!@#$%^&* etc.)
 */
public class PasswordValidator {

    private static final Pattern UPPER_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWER_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[^A-Za-z0-9]");

    public static boolean hasMinLength(String password) {
        // Evaluate whether password meets the 8-character minimum security threshold
        return password != null && password.length() >= 8;
    }

    public static boolean hasUpper(String password) {
        // Match regex to check for existence of at least one uppercase letter (A-Z)
        return password != null && UPPER_PATTERN.matcher(password).find();
    }

    public static boolean hasLower(String password) {
        // Match regex to verify presence of at least one lowercase character (a-z)
        return password != null && LOWER_PATTERN.matcher(password).find();
    }

    public static boolean hasDigit(String password) {
        // Check regex pattern matching to ensure at least one numeric digit (0-9)
        return password != null && DIGIT_PATTERN.matcher(password).find();
    }

    public static boolean hasSpecial(String password) {
        // Search for non-alphanumeric special character symbol (!@#$% etc.)
        return password != null && SPECIAL_PATTERN.matcher(password).find();
    }

    public static int getScore(String password) {
        // Calculate cumulative score (0 to 5) across all security evaluation criteria
        if (password == null || password.isEmpty()) return 0;
        int score = 0;
        if (hasMinLength(password)) score++;
        if (hasUpper(password)) score++;
        if (hasLower(password)) score++;
        if (hasDigit(password)) score++;
        if (hasSpecial(password)) score++;
        return score;
    }

    public static boolean isStrong(String password) {
        // Verify that password successfully satisfies all 5 strength requirements
        return getScore(password) == 5;
    }

    public static String getStrengthLabel(String password) {
        // Map numerical password score to user-facing strength classification label
        int score = getScore(password);
        if (score == 5) return "Strong";
        if (score >= 3) return "Medium";
        if (score >= 1) return "Weak";
        return "";
    }
}
