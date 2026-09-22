// ============================================================================
// File: SplashActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Application launch gateway. Checks theme preference, verifies
//              active login session in SQLite, and routes to appropriate flow
//              (Onboarding -> Login, or directly to role home screen).
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.data.OnboardingPrefs;
import com.smartsolar.mobile.data.ThemeManager;
import com.smartsolar.mobile.ui.operator.OperatorMainActivity;
import com.smartsolar.mobile.ui.prosumer.ProsumerMainActivity;
import com.smartsolar.mobile.R;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Apply saved theme, show branding splash, then route based on session and onboarding state
        ThemeManager.apply(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            SessionManager session = new SessionManager(this);

            if (session.isLoggedIn()) {
                routeByRole(session.getRole());
            } else if (!OnboardingPrefs.isCompleted(this)) {
                startActivity(new Intent(this, OnboardingActivity.class));
                finish();
            } else {
                startActivity(new Intent(this, LoginActivity.class));
                finish();
            }

            session.close();
        }, 2000);
    }

    private void routeByRole(String role) {
        // Redirect authenticated user to GridOperator or Prosumer home screen based on role string
        Intent intent;

        if ("GridOperator".equals(role)) {
            intent = new Intent(this, OperatorMainActivity.class);
        } else {
            intent = new Intent(this, ProsumerMainActivity.class);
        }

        intent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TASK
        );

        startActivity(intent);
        finish();
    }
}