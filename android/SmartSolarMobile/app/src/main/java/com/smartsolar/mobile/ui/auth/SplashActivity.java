// ============================================================================
// File: SplashActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Application launch gateway that checks the active SQLite session.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            SessionManager session = new SessionManager(this);

            if (session.isLoggedIn()) {
                routeByRole(session.getRole());
            } else {
                startActivity(new Intent(this, LoginActivity.class));
                finish();
            }

            session.close();
        }, 2000);
    }

    private void routeByRole(String role) {
        Intent intent = new Intent(this, ProsumerMainActivity.class);
        intent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TASK
        );

        startActivity(intent);
        finish();
    }
}