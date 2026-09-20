// ============================================================================
// File: OnboardingPrefs.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: SharedPreferences utility for tracking SmartSolar onboarding state.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import android.content.SharedPreferences;

/** Stores the onboarding completion state for the SmartSolar application. */
public final class OnboardingPrefs {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_ONBOARDING_COMPLETED = "onboarding_completed";

    private OnboardingPrefs() {}

    /** Returns whether onboarding has been completed. */
    public static boolean isCompleted(Context context) {
        SharedPreferences prefs =
                context.getSharedPreferences(FILE, Context.MODE_PRIVATE);

        return prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false);
    }

    /** Saves the onboarding completion state. */
    public static void setCompleted(Context context, boolean completed) {
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_ONBOARDING_COMPLETED, completed)
                .apply();
    }
}