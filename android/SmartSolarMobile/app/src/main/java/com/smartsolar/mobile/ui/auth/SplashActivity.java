// ============================================================================
// File: SplashActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Application launch splash screen.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;

public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
    }
}