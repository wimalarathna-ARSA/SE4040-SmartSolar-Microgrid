// ============================================================================
// File: SolarHouseArt.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Microgrid solar generation artwork asset manager for UI visual hierarchy.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.common;

import android.widget.ImageView;

import com.smartsolar.mobile.R;

/**
 * Central helper for rotating the 5 professional solar-house photos
 * across prosumer + operator screens.
 *
 * Expected assets (drop your PNGs here):
 *   app/src/main/res/drawable-nodpi/house_solar_1.png
 *   app/src/main/res/drawable-nodpi/house_solar_2.png
 *   ... house_solar_5.png
 *
 * Temporary vector placeholders (house_solar_1.xml …) ship with the
 * project so the build passes until you replace them with the real PNGs.
 * To replace: delete the .xml and add the .png with the same base name.
 */
public final class SolarHouseArt {

    private SolarHouseArt() {}

    /** Cycle 0..4 -> house_solar_1..5 */
    public static int forIndex(int position) {
        // Compute cyclic index (0 to 4) to map a position to one of the 5 solar house illustrations
        int i = Math.abs(position) % 5;
        switch (i) {
            case 0: return R.drawable.house_solar_1;
            case 1: return R.drawable.house_solar_2;
            case 2: return R.drawable.house_solar_3;
            case 3: return R.drawable.house_solar_4;
            default: return R.drawable.house_solar_5;
        }
    }

    /** Best hero per screen (wide, well-lit houses). */
    public static int prosumerHero() {
        // Return designated hero banner artwork resource ID for the prosumer home screen
        return R.drawable.house_solar_4;
    }
    public static int operatorHero() {
        // Return designated hero banner artwork resource ID for the grid operator dashboard
        return R.drawable.house_solar_3;
    }
    public static int profileCover() {
        // Return profile cover background illustration resource ID
        return R.drawable.house_solar_5;
    }

    /** Safe setter — never crashes if an asset is missing. */
    public static void apply(ImageView view, int resId) {
        // Safely set image resource onto target ImageView while suppressing missing asset exceptions
        if (view == null) return;
        try {
            view.setImageResource(resId);
        } catch (Exception ignored) {
            // placeholder background stays visible
        }
    }

    public static void applyCycling(ImageView view, int position) {
        // Apply cyclical solar house image based on item position index
        apply(view, forIndex(position));
    }
}
