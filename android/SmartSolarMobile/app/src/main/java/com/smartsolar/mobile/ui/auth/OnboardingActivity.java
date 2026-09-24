// ============================================================================
// File: OnboardingActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Two-screen pre-login onboarding hosted in a ViewFlipper.
//              Provides navigation between the network and booking screens.
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.ViewFlipper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;

/** Pre-login onboarding: Screen 1 (network) → Screen 2 (booking flow). */
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

        View btnBack = findViewById(R.id.btn_onboarding_back);
        if (btnBack != null) {
            btnBack.setOnClickListener(v -> showPage(0));
        }
    }

    /** Displays the requested onboarding page. */
    private void showPage(int page) {
        if (flipper == null) return;

        flipper.setDisplayedChild(page);
    }
}