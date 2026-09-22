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
 * app/src/main/res/drawable-nodpi/house_solar_1.png
 * app/src/main/res/drawable-nodpi/house_solar_2.png
 * app/src/main/res/drawable-nodpi/house_solar_3.png
 * app/src/main/res/drawable-nodpi/house_solar_4.png
 * app/src/main/res/drawable-nodpi/house_solar_5.png
 *
 * Temporary vector placeholders (house_solar_1.xml …) ship with the
 * project so the build passes until they are replaced with the real PNGs.
 * To replace: delete the .xml and add the .png with the same base name.
 */
public final class SolarHouseArt {

    private SolarHouseArt() {}

    /**
     * Cycle 0..4 -> house_solar_1..5.
     */
    public static int forIndex(int position) {
        int i = Math.abs(position) % 5;

        switch (i) {
            case 0:
                return R.drawable.house_solar_1;

            case 1:
                return R.drawable.house_solar_2;

            case 2:
                return R.drawable.house_solar_3;

            case 3:
                return R.drawable.house_solar_4;

            default:
                return R.drawable.house_solar_5;
        }
    }

    /**
     * Best hero per screen.
     * Wide, well-lit houses are selected for major UI banners.
     */
    public static int prosumerHero() {
        return R.drawable.house_solar_4;
    }

    public static int operatorHero() {
        return R.drawable.house_solar_3;
    }

    public static int profileCover() {
        return R.drawable.house_solar_5;
    }

    /**
     * Safe setter — never crashes if an asset is missing.
     */
    public static void apply(ImageView view, int resId) {
        if (view == null) {
            return;
        }

        try {
            view.setImageResource(resId);
        } catch (Exception ignored) {
            // Placeholder background stays visible.
        }
    }

    /**
     * Apply a cyclical solar house image based on item position.
     */
    public static void applyCycling(ImageView view, int position) {
        apply(view, forIndex(position));
    }
}