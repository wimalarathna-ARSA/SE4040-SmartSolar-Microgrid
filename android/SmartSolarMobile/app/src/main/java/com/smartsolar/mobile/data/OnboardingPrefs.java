// ============================================================================
// File: OnboardingPrefs.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Lightweight SharedPreferences flag tracking whether the
//              two-screen onboarding has been completed.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import android.content.SharedPreferences;

/** Onboarding completion flag for the SmartSolar pre-login flow. */
public final class OnboardingPrefs {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_ONBOARDING_COMPLETED = "onboarding_completed";

    private OnboardingPrefs() {}

    /**
     * Returns true after the user completes the onboarding walkthrough.
     * Defaults to false for a fresh installation.
     */
    public static boolean isCompleted(Context context) {
        SharedPreferences prefs =
                context.getSharedPreferences(FILE, Context.MODE_PRIVATE);

        return prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false);
    }

    /** Persists whether the onboarding walkthrough has been completed. */
    public static void setCompleted(Context context, boolean completed) {
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_ONBOARDING_COMPLETED, completed)
                .apply();
    }
}