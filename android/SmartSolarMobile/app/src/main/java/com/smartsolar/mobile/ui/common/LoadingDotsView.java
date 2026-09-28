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
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.ScaleAnimation;
import android.widget.LinearLayout;

import com.smartsolar.mobile.R;

import java.util.ArrayList;
import java.util.List;

/**
 * 3-dot loading indicator (replaces the circular spinner app-wide).
 * Small dots wave light -&gt; dark brand-teal -&gt; light in sequence.
 * Uses classic view animations + a handler color loop (no Animator
 * engine dependency), so it runs on every device/animation setting.
 *
 * Drop-in replacement: same loading contract as ProgressBar
 * (show = VISIBLE, hide = GONE).
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

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            if (!running) return;
            long now = System.currentTimeMillis() - startTime;
            for (int i = 0; i < dots.size(); i++) {
                View dot = dots.get(i);
                int color = lerpColor(lightColor, darkColor, wave(now, i));
                try {
                    if (dot.getBackground() != null) {
                        dot.getBackground().setColorFilter(color, PorterDuff.Mode.SRC_IN);
                    }
                } catch (Exception ignored) {
                }
            }
            handler.postDelayed(this, TICK_MS);
        }
    };

    public LoadingDotsView(Context context) {
        super(context);
        // Initialize 3-dot loading layout programmatically
        init(context);
    }

    public LoadingDotsView(Context context, AttributeSet attrs) {
        super(context, attrs);
        // Initialize 3-dot loading layout from XML attributes
        init(context);
    }

    public LoadingDotsView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        // Initialize 3-dot loading layout with style attributes
        init(context);
    }

    private void init(Context context) {
        // Construct horizontal dot layout and instantiate the 3 pulsating dot views
        setOrientation(HORIZONTAL);
        setGravity(Gravity.CENTER);
        float density = context.getResources().getDisplayMetrics().density;
        int dotSize = Math.round(7 * density);
        int gap = Math.round(5 * density);
        int padding = Math.round(8 * density);
        setPadding(padding, padding, padding, padding);

        try {
            lightColor = context.getResources().getColor(R.color.neuro_shadow_light);
            darkColor = context.getResources().getColor(R.color.neuro_green);
        } catch (Exception ignored) {
            // fallback defaults already set
        }
        // Push the light end nearer white so the wave reads clearly.
        lightColor = lighten(lightColor);

        for (int i = 0; i < 3; i++) {
            View dot = new View(context);
            LayoutParams lp = new LayoutParams(dotSize, dotSize);
            if (i > 0) lp.setMarginStart(gap);
            dot.setLayoutParams(lp);
            try {
                dot.setBackgroundResource(R.drawable.bg_loading_dot);
                if (dot.getBackground() != null) dot.getBackground().mutate();
            } catch (Exception ignored) {
                dot.setBackgroundColor(lightColor);
            }
            addView(dot);
            dots.add(dot);
        }
    }

    /** 0 → 1 → 0 triangle wave, staggered per dot. */
    private float wave(long now, int index) {
        // Calculate periodic triangle wave offset for the specified dot index
        long local = (now - index * STAGGER_MS) % CYCLE_MS;
        if (local < 0) local += CYCLE_MS;
        float half = CYCLE_MS / 2f;
        if (local < half) return local / half;
        return 1f - (local - half) / half;
    }

    private static int lerpColor(int from, int to, float t) {
        // Linearly interpolate ARGB color components between two color endpoints
        float it = 1f - t;
        int a = Math.round(((from >>> 24) & 0xFF) * it + ((to >>> 24) & 0xFF) * t);
        int r = Math.round(((from >>> 16) & 0xFF) * it + ((to >>> 16) & 0xFF) * t);
        int g = Math.round(((from >>> 8) & 0xFF) * it + ((to >>> 8) & 0xFF) * t);
        int b = Math.round((from & 0xFF) * it + (to & 0xFF) * t);
        return (a << 24) | (r << 16) | (g << 8) | b;
    }

    private static int lighten(int color) {
        // Brighten RGB color channels to enhance visual contrast of pulsing wave
        int r = Math.min(255, ((color >>> 16) & 0xFF) + 24);
        int g = Math.min(255, ((color >>> 8) & 0xFF) + 24);
        int b = Math.min(255, (color & 0xFF) + 24);
        return (0xFF << 24) | (r << 16) | (g << 8) | b;
    }

    private void startMotion(View dot, int index) {
        // Configure and attach staggered alpha and scale animations to dot view
        AnimationSet set = new AnimationSet(true);
        AlphaAnimation alpha = new AlphaAnimation(0.35f, 1f);
        alpha.setDuration(525);
        ScaleAnimation scale = new ScaleAnimation(
                0.75f, 1.1f, 0.75f, 1.1f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f);
        scale.setDuration(525);
        set.addAnimation(alpha);
        set.addAnimation(scale);
        set.setStartOffset(index * STAGGER_MS);
        set.setRepeatCount(Animation.INFINITE);
        set.setRepeatMode(Animation.REVERSE);
        dot.startAnimation(set);
    }

    private void start() {
        // Trigger dot animations and register cyclical color tint handler callback
        if (running) return;
        running = true;
        startTime = System.currentTimeMillis();
        for (int i = 0; i < dots.size(); i++) {
            startMotion(dots.get(i), i);
        }
        handler.post(ticker);
    }

    private void stop() {
        // Cancel active handler callbacks and clear dot view animation sets
        if (!running) return;
        running = false;
        handler.removeCallbacks(ticker);
        for (View dot : dots) {
            try {
                dot.clearAnimation();
            } catch (Exception ignored) {
            }
        }
    }

    @Override
    protected void onAttachedToWindow() {
        // Resume pulsing animation if view is attached and currently visible
        super.onAttachedToWindow();
        if (getVisibility() == VISIBLE) start();
    }

    @Override
    protected void onDetachedFromWindow() {
        // Stop animations when detached from window hierarchy to conserve resources
        stop();
        super.onDetachedFromWindow();
    }

    @Override
    protected void onVisibilityChanged(View changedView, int visibility) {
        // Toggle animation playback state in response to view visibility changes
        super.onVisibilityChanged(changedView, visibility);
        if (visibility == VISIBLE) {
            if (isAttachedToWindow()) start();
        } else {
            stop();
        }
    }
}
