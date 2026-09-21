// ============================================================================
// File: ThemeManager.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: App theme preference backed by SharedPreferences.
//              Default is light and the selected mode is applied globally.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import androidx.appcompat.app.AppCompatDelegate;

/** Light/dark theme preference. Default: light. */
public final class ThemeManager {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_DARK_THEME = "dark_theme_enabled";

    private ThemeManager() {}

    /** Returns true when the user selected the dark theme. */
    public static boolean isDarkTheme(Context context) {
        return context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .getBoolean(KEY_DARK_THEME, false);
    }

    /** Persists the theme choice and applies it immediately. */
    public static void setDarkTheme(Context context, boolean dark) {
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_DARK_THEME, dark)
                .apply();

        apply(context);
    }

    /** Applies the saved theme configuration to the application. */
    public static void apply(Context context) {
        AppCompatDelegate.setDefaultNightMode(isDarkTheme(context)
                ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO);
    }
}