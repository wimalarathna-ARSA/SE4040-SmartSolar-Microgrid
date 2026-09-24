// ============================================================================
// File: OnboardingActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Two-screen pre-login onboarding hosted in a ViewFlipper.
//              Shown on first install and after logout (see SplashActivity
//              and the logout paths). Completing or skipping onboarding
//              records OnboardingPrefs and routes to the existing Login.
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.animation.AnimationUtils;
import android.widget.ViewFlipper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.OnboardingPrefs;

/** Pre-login onboarding: Screen 1 (network) → Screen 2 (booking flow) → Login. */
public class OnboardingActivity extends AppCompatActivity {

    private ViewFlipper flipper;
    private View dot1;
    private View dot2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Inflate onboarding layout, bind ViewFlipper and dot indicators, wire slide navigation buttons
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);

        flipper = findViewById(R.id.onboarding_flipper);
        dot1 = findViewById(R.id.onboarding_dot_1);
        dot2 = findViewById(R.id.onboarding_dot_2);

        // Screen 1 actions
        View btnNext = findViewById(R.id.btn_onboarding_next);
        if (btnNext != null) btnNext.setOnClickListener(v -> showPage(1));
        View btnSkip = findViewById(R.id.btn_onboarding_skip);
        if (btnSkip != null) btnSkip.setOnClickListener(v -> finishOnboarding());

        // Screen 2 actions
        View btnBack = findViewById(R.id.btn_onboarding_back);
        if (btnBack != null) btnBack.setOnClickListener(v -> showPage(0));
        View btnGetStarted = findViewById(R.id.btn_onboarding_get_started);
        if (btnGetStarted != null) btnGetStarted.setOnClickListener(v -> finishOnboarding());

        updateDots(flipper.getDisplayedChild());
    }

    /** Flips to the given page with a directional slide. */
    private void showPage(int page) {
        // Apply directional slide animation and display the requested onboarding page
        if (flipper == null || flipper.getDisplayedChild() == page) return;
        try {
            if (page > flipper.getDisplayedChild()) {
                flipper.setInAnimation(AnimationUtils.loadAnimation(this, R.anim.slide_in_right));
                flipper.setOutAnimation(AnimationUtils.loadAnimation(this, R.anim.slide_out_left));
            } else {
                flipper.setInAnimation(AnimationUtils.loadAnimation(this, R.anim.slide_in_left));
                flipper.setOutAnimation(AnimationUtils.loadAnimation(this, R.anim.slide_out_right));
            }
        } catch (Exception ignored) {}
        flipper.setDisplayedChild(page);
        updateDots(page);
    }

    /** Marks onboarding complete and routes to the existing Login screen. */
    private void finishOnboarding() {
        // Persist onboarding completion flag and navigate to Login with cleared back stack
        OnboardingPrefs.setCompleted(this, true);
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void updateDots(int page) {
        // Toggle dot indicator drawable states to reflect the currently displayed onboarding page
        if (dot1 != null) dot1.setBackgroundResource(page == 0
                ? R.drawable.bg_onboarding_dot_selected
                : R.drawable.bg_onboarding_dot_unselected);
        if (dot2 != null) dot2.setBackgroundResource(page == 1
                ? R.drawable.bg_onboarding_dot_selected
                : R.drawable.bg_onboarding_dot_unselected);
    }

    @Override
    public void onBackPressed() {
        // Intercept back press: go to previous page if on page 2, otherwise let system handle
        if (flipper != null && flipper.getDisplayedChild() == 1) {
            showPage(0);
        } else {
            super.onBackPressed();
        }
    }
}
