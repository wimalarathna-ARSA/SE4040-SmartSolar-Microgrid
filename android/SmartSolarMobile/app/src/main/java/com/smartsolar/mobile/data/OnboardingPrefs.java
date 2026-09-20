// ============================================================================
// File: OnboardingPrefs.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Lightweight SharedPreferences flag tracking whether the
//              two-screen onboarding has been completed. The authenticated
//              session itself stays in SQLite (SessionManager) — this flag
//              only controls the pre-login onboarding gate and is reset on
//              logout so onboarding shows again after sign-out.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import android.content.SharedPreferences;

/** Onboarding completion flag (pre-login flow, not auth state). */
public final class OnboardingPrefs {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_ONBOARDING_COMPLETED = "onboarding_completed";

    private OnboardingPrefs() {}

    /** Returns true once the user has swiped through onboarding. Defaults to false (first install). */
    public static boolean isCompleted(Context context) {
        // Read the persistent boolean flag indicating if the user has previously finished onboarding walkthrough
        SharedPreferences prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false);
    }

    /** Persists the onboarding completion state. */
    public static void setCompleted(Context context, boolean completed) {
        // Asynchronously update and commit the onboarding completion flag into SharedPreferences
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_ONBOARDING_COMPLETED, completed)
                .apply();
    }
}