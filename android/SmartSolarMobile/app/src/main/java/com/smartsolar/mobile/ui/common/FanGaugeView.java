// ============================================================================
// File: FanGaugeView.java
// Description: Semi-circular fan gauge like the Sales Overview reference —
//              rounded blades, filled portion in a teal gradient, rest in
//              light gray. Fraction 0..1 controls how many blades are filled.
// ============================================================================
package com.smartsolar.mobile.ui.common;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

public class FanGaugeView extends View {

    private static final int[] STOPS = {
            0xFF063127, 0xFF3B796A, 0xFF65998B, 0xFF8FB3A9, 0xFFBFD5D0 };
    private static final int EMPTY_COLOR = 0xFFE6EBF0;

    private int bladeCount = 18;
    private float fraction = 0f; // 0..1
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

    public FanGaugeView(Context context) {
        super(context);
        init();
    }

    public FanGaugeView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public FanGaugeView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
    }

    /** Filled portion of the fan, 0..1. */
    public void setFraction(float fraction) {
        this.fraction = Math.max(0f, Math.min(1f, fraction));
        invalidate();
    }

    public void setBladeCount(int bladeCount) {
        if (bladeCount > 1) this.bladeCount = bladeCount;
        invalidate();
    }

    /** Dark (left) -> light (center) gradient position across the filled blades. */
    private static int gradient(float t) {
        t = Math.max(0f, Math.min(1f, t));
        float pos = t * (STOPS.length - 1);
        int lo = (int) Math.floor(pos);
        int hi = Math.min(lo + 1, STOPS.length - 1);
        float f = pos - lo;
        int a = STOPS[lo];
        int b = STOPS[hi];
        return Color.argb(
                0xFF,
                Math.round(Color.red(a) + (Color.red(b) - Color.red(a)) * f),
                Math.round(Color.green(a) + (Color.green(b) - Color.green(a)) * f),
                Math.round(Color.blue(a) + (Color.blue(b) - Color.blue(a)) * f));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float w = getWidth();
        float h = getHeight();
        if (w <= 0 || h <= 0) return;

        float pad = Math.max(8f, w * 0.04f);
        float outerR = Math.min(w / 2f - pad, h - pad);
        if (outerR <= 0) return;
        float innerR = outerR * 0.58f;
        float cx = w / 2f;
        float cy = h - pad * 0.75f;

        float spacing = (float) (Math.PI * outerR / bladeCount);
        paint.setStrokeWidth(Math.max(4f, spacing * 0.52f));

        int filled = Math.round(fraction * bladeCount);
        for (int i = 0; i < bladeCount; i++) {
            double angle = Math.toRadians(180.0 - i * (180.0 / (bladeCount - 1)));
            float cos = (float) Math.cos(angle);
            float sin = (float) Math.sin(angle);
            float x0 = cx + cos * innerR;
            float y0 = cy - sin * innerR;
            float x1 = cx + cos * outerR;
            float y1 = cy - sin * outerR;
            if (i < filled) {
                float t = filled <= 1 ? 1f : (float) i / (float) (filled - 1);
                paint.setColor(gradient(t));
            } else {
                paint.setColor(EMPTY_COLOR);
            }
            canvas.drawLine(x0, y0, x1, y1, paint);
        }
    }
}
