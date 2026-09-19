// ============================================================================
// File: LoadingDotsView.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Custom animated loading dots view for network operations and telemetry fetching.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================

package com.smartsolar.mobile.ui.common;

import android.content.Context;
import android.graphics.PorterDuff;
import android.os.Handler;
import android.os.Looper;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;

import com.smartsolar.mobile.R;

import java.util.ArrayList;
import java.util.List;

/**
 * 3-dot loading indicator.
 * Small dots wave from light to dark brand teal.
 */
public class LoadingDotsView extends LinearLayout {

    private final List<View> dots = new ArrayList<>(3);
    private final Handler handler = new Handler(Looper.getMainLooper());

    private boolean running = false;
    private long startTime = 0L;

    private int lightColor = 0xFFE2E8F0;
    private int darkColor = 0xFF2F5D62;

    private static final long CYCLE_MS = 1050L;
    private static final long STAGGER_MS = 170L;
    private static final long TICK_MS = 50L;

    public LoadingDotsView(Context context) {
        super(context);
        init(context);
    }

    public LoadingDotsView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public LoadingDotsView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(Context context) {
        setOrientation(HORIZONTAL);
        setGravity(Gravity.CENTER);

        float density = context.getResources().getDisplayMetrics().density;

        int dotSize = Math.round(7 * density);
        int gap = Math.round(5 * density);
        int padding = Math.round(8 * density);

        setPadding(padding, padding, padding, padding);

        try {
            lightColor = context.getResources()
                    .getColor(R.color.neuro_shadow_light);

            darkColor = context.getResources()
                    .getColor(R.color.neuro_green);
        } catch (Exception ignored) {
            // Use fallback colors.
        }

        lightColor = lighten(lightColor);

        for (int i = 0; i < 3; i++) {
            View dot = new View(context);

            LayoutParams lp = new LayoutParams(dotSize, dotSize);

            if (i > 0) {
                lp.setMarginStart(gap);
            }

            dot.setLayoutParams(lp);

            try {
                dot.setBackgroundResource(R.drawable.bg_loading_dot);

                if (dot.getBackground() != null) {
                    dot.getBackground().mutate();
                }
            } catch (Exception ignored) {
                dot.setBackgroundColor(lightColor);
            }

            addView(dot);
            dots.add(dot);
        }
    }

    private static int lighten(int color) {
        int r = Math.min(255, ((color >>> 16) & 0xFF) + 24);
        int g = Math.min(255, ((color >>> 8) & 0xFF) + 24);
        int b = Math.min(255, (color & 0xFF) + 24);

        return (0xFF << 24) | (r << 16) | (g << 8) | b;
    }
}