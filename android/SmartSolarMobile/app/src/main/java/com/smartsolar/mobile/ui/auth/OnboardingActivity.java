// ============================================================================
// File: OnboardingActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Two-screen pre-login onboarding hosted in a ViewFlipper.
//              Completing or skipping onboarding records OnboardingPrefs and
//              routes the user to the existing Login screen.
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ViewFlipper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.OnboardingPrefs;

/** Pre-login onboarding: Screen 1 (network) → Screen 2 (booking flow) → Login. */
public class OnboardingActivity extends AppCompatActivity {

    private ViewFlipper flipper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);

        flipper = findViewById(R.id.onboarding_flipper);

        View btnNext = findViewById(R.id.btn_onboarding_next);
        if (btnNext != null) {
            btnNext.setOnClickListener(v -> showPage(1));
        }

        View btnSkip = findViewById(R.id.btn_onboarding_skip);
        if (btnSkip != null) {
            btnSkip.setOnClickListener(v -> finishOnboarding());
        }

        View btnBack = findViewById(R.id.btn_onboarding_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> showPage(0));
        }

        View btnGetStarted = findViewById(R.id.btn_onboarding_get_started);
        if (btnGetStarted != null) {
            btnGetStarted.setOnClickListener(v -> finishOnboarding());
        }
    }

    /** Displays the requested onboarding page. */
    private void showPage(int page) {
        if (flipper == null || flipper.getDisplayedChild() == page) return;

        flipper.setDisplayedChild(page);
    }

    /** Saves completion state and opens the existing Login screen. */
    private void finishOnboarding() {
        OnboardingPrefs.setCompleted(this, true);

        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        startActivity(intent);
        finish();
    }
}