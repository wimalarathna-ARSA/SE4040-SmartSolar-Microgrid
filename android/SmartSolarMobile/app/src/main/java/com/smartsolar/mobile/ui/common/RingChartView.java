// ============================================================================
// File: RingChartView.java
// Description: Concentric progress rings like the Channels ring-chart
//              reference — rounded caps, faded track behind each ring.
//              Fractions 0..1 per ring, animated together.
// ============================================================================
package com.smartsolar.mobile.ui.common;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

import java.util.ArrayList;
import java.util.List;

public class RingChartView extends View {

    /** One concentric ring: share of the whole (0..1) + solid color. */
    public static class Ring {
        public final float fraction;
        public final int color;

        public Ring(float fraction, int color) {
            this.fraction = Math.max(0f, Math.min(1f, fraction));
            this.color = color;
        }
    }

    private final List<Ring> rings = new ArrayList<>();
    private float progress = 1f; // animation 0..1
    private ValueAnimator animator;
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF arcBounds = new RectF();

    public RingChartView(Context context) {
        super(context);
        init();
    }

    public RingChartView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public RingChartView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
    }

    /** Replace rings and replay the sweep animation. */
    public void setRings(List<Ring> data) {
        rings.clear();
        if (data != null) rings.addAll(data);
        progress = 0f;
        invalidate();
        if (animator != null) animator.cancel();
        animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(1100);
        animator.setInterpolator(new android.view.animation.DecelerateInterpolator(1.5f));
        animator.addUpdateListener(a -> {
            progress = (float) a.getAnimatedValue();
            invalidate();
        });
        animator.start();
    }

    private static int faded(int color) {
        return Color.argb(38, Color.red(color), Color.green(color), Color.blue(color));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (rings.isEmpty()) return;
        float w = getWidth();
        float h = getHeight();
        if (w <= 0 || h <= 0) return;

        float density = getResources().getDisplayMetrics().density;
        float stroke = 11f * density;
        float gap = 7f * density;
        float cx = w / 2f;
        float cy = h / 2f;
        float radius = Math.min(w, h) / 2f - stroke / 2f - 2f * density;
        if (radius <= 0) return;

        paint.setStrokeWidth(stroke);
        for (Ring ring : rings) {
            float r = radius;
            radius -= (stroke + gap);
            if (r <= 0) break;
            arcBounds.set(cx - r, cy - r, cx + r, cy + r);
            paint.setColor(faded(ring.color));
            canvas.drawArc(arcBounds, 0f, 360f, false, paint);
            float sweep = ring.fraction * progress * 360f;
            if (sweep > 0f) {
                paint.setColor(ring.color);
                canvas.drawArc(arcBounds, -90f, sweep, false, paint);
            }
        }
    }
}
