// ============================================================================
// File: ThemeManager.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: App theme preference (light/dark) backed by SharedPreferences.
//              Default is light. Applies via AppCompatDelegate so every
//              activity follows the saved mode; drawables resolve their
//              light/dark colors through values / values-night tokens.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import androidx.appcompat.app.AppCompatDelegate;

/** Light/dark theme preference. Default: light. */
public final class ThemeManager {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_DARK_THEME = "dark_theme_enabled";

    private ThemeManager() {}

    /** Returns true when the user selected the dark theme. Defaults to false (light). */
    public static boolean isDarkTheme(Context context) {
        // Query SharedPreferences to check if dark mode setting is enabled by the user
        return context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .getBoolean(KEY_DARK_THEME, false);
    }

    /** Persists the theme choice and applies it app-wide immediately. */
    public static void setDarkTheme(Context context, boolean dark) {
        // Persist theme selection into preferences and immediately update AppCompatDelegate mode
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_DARK_THEME, dark)
                .apply();
        apply(context);
    }

    /** Applies the saved theme. Call before setContentView (e.g. Splash). */
    public static void apply(Context context) {
        // Configure global night mode delegate matching the stored theme configuration
        AppCompatDelegate.setDefaultNightMode(isDarkTheme(context)
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO);
    }
}