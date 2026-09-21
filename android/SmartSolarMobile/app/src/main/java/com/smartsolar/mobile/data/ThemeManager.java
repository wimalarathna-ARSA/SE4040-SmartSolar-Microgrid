// ============================================================================
// File: ThemeManager.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: App theme preference backed by SharedPreferences.
//              Default theme is light.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import androidx.appcompat.app.AppCompatDelegate;

/** Light/dark theme preference. Default: light. */
public final class ThemeManager {

    private static final String FILE = "smartsolar_prefs";
    private static final String KEY_DARK_THEME = "dark_theme_enabled";

    private ThemeManager() {}

    /** Returns true when dark theme is enabled. */
    public static boolean isDarkTheme(Context context) {
        return context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .getBoolean(KEY_DARK_THEME, false);
    }

    /** Saves the user's theme preference. */
    public static void setDarkTheme(Context context, boolean dark) {
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_DARK_THEME, dark)
                .apply();
    }
}