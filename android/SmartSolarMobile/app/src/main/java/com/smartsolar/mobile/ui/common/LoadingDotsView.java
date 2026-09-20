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

                int color = lerpColor(
                        lightColor,
                        darkColor,
                        wave(now, i)
                );

                try {
                    if (dot.getBackground() != null) {
                        dot.getBackground().setColorFilter(
                                color,
                                PorterDuff.Mode.SRC_IN
                        );
                    }
                } catch (Exception ignored) {
                }
            }

            handler.postDelayed(this, TICK_MS);
        }
    };

    public LoadingDotsView(Context context) {
        super(context);
        init(context);
    }

    public LoadingDotsView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public LoadingDotsView(
            Context context,
            AttributeSet attrs,
            int defStyleAttr
    ) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    private void init(Context context) {
        setOrientation(HORIZONTAL);
        setGravity(Gravity.CENTER);

        float density =
                context.getResources()
                        .getDisplayMetrics()
                        .density;

        int dotSize = Math.round(7 * density);
        int gap = Math.round(5 * density);
        int padding = Math.round(8 * density);

        setPadding(
                padding,
                padding,
                padding,
                padding
        );

        try {
            lightColor = context.getResources()
                    .getColor(R.color.neuro_shadow_light);

            darkColor = context.getResources()
                    .getColor(R.color.neuro_green);
        } catch (Exception ignored) {
        }

        lightColor = lighten(lightColor);

        for (int i = 0; i < 3; i++) {
            View dot = new View(context);

            LayoutParams lp =
                    new LayoutParams(dotSize, dotSize);

            if (i > 0) {
                lp.setMarginStart(gap);
            }

            dot.setLayoutParams(lp);

            try {
                dot.setBackgroundResource(
                        R.drawable.bg_loading_dot
                );

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

    private float wave(long now, int index) {
        long local =
                (now - index * STAGGER_MS) % CYCLE_MS;

        if (local < 0) {
            local += CYCLE_MS;
        }

        float half = CYCLE_MS / 2f;

        if (local < half) {
            return local / half;
        }

        return 1f - (local - half) / half;
    }

    private static int lerpColor(
            int from,
            int to,
            float t
    ) {
        float it = 1f - t;

        int a = Math.round(
                ((from >>> 24) & 0xFF) * it
                        + ((to >>> 24) & 0xFF) * t
        );

        int r = Math.round(
                ((from >>> 16) & 0xFF) * it
                        + ((to >>> 16) & 0xFF) * t
        );

        int g = Math.round(
                ((from >>> 8) & 0xFF) * it
                        + ((to >>> 8) & 0xFF) * t
        );

        int b = Math.round(
                (from & 0xFF) * it
                        + (to & 0xFF) * t
        );

        return (a << 24)
                | (r << 16)
                | (g << 8)
                | b;
    }

    private static int lighten(int color) {
        int r = Math.min(
                255,
                ((color >>> 16) & 0xFF) + 24
        );

        int g = Math.min(
                255,
                ((color >>> 8) & 0xFF) + 24
        );

        int b = Math.min(
                255,
                (color & 0xFF) + 24
        );

        return (0xFF << 24)
                | (r << 16)
                | (g << 8)
                | b;
    }

    private void startMotion(View dot, int index) {
        AnimationSet set = new AnimationSet(true);

        AlphaAnimation alpha =
                new AlphaAnimation(0.35f, 1f);

        alpha.setDuration(525);

        ScaleAnimation scale =
                new ScaleAnimation(
                        0.75f,
                        1.1f,
                        0.75f,
                        1.1f,
                        Animation.RELATIVE_TO_SELF,
                        0.5f,
                        Animation.RELATIVE_TO_SELF,
                        0.5f
                );

        scale.setDuration(525);

        set.addAnimation(alpha);
        set.addAnimation(scale);

        set.setStartOffset(index * STAGGER_MS);
        set.setRepeatCount(Animation.INFINITE);
        set.setRepeatMode(Animation.REVERSE);

        dot.startAnimation(set);
    }

    private void start() {
        if (running) return;

        running = true;
        startTime = System.currentTimeMillis();

        for (int i = 0; i < dots.size(); i++) {
            startMotion(dots.get(i), i);
        }

        handler.post(ticker);
    }

    private void stop() {
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

    private void updateAnimationState() {
        if (getVisibility() == VISIBLE
                && isAttachedToWindow()) {
            start();
        } else {
            stop();
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        updateAnimationState();
    }

    @Override
    protected void onDetachedFromWindow() {
        stop();
        super.onDetachedFromWindow();
    }

    @Override
    protected void onVisibilityChanged(
            View changedView,
            int visibility
    ) {
        super.onVisibilityChanged(
                changedView,
                visibility
        );

        updateAnimationState();
    }
}