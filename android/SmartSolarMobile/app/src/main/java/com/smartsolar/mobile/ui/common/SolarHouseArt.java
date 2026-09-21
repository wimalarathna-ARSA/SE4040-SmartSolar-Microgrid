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
 * Expected assets:
 * app/src/main/res/drawable-nodpi/house_solar_1.png
 * app/src/main/res/drawable-nodpi/house_solar_2.png
 * house_solar_3.png
 * house_solar_4.png
 * house_solar_5.png
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
}