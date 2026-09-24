```java
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.data.ThemeManager;
import com.smartsolar.mobile.ui.auth.LoginActivity;

public class SettingsActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header)
                .setOnClickListener(v -> finish());

        updateLogoutDescription();

        View btnLogout = findViewById(R.id.btn_logout_action);

        if (btnLogout != null) {
            btnLogout.setOnClickListener(
                    v -> showLogoutConfirmation()
            );
        }

        setupThemeSelection();
    }

    private void updateLogoutDescription() {
        TextView tvDesc = findViewById(R.id.tv_logout_desc);

        if (tvDesc == null) {
            return;
        }

        String role = sessionManager.getRole();

        if ("GridOperator".equals(role)) {
            tvDesc.setText(
                    "Securely sign out of the operator console."
            );
        } else {
            tvDesc.setText(
                    "Securely sign out of your prosumer account."
            );
        }
    }

    private void setupThemeSelection() {
        View btnThemeLight = findViewById(R.id.btn_theme_light);
        View btnThemeDark = findViewById(R.id.btn_theme_dark);

        if (btnThemeLight != null) {
            btnThemeLight.setOnClickListener(v -> {
                if (ThemeManager.isDarkTheme(this)) {
                    ThemeManager.setDarkTheme(this, false);
                }

                updateThemeToggle();
            });
        }

        if (btnThemeDark != null) {
            btnThemeDark.setOnClickListener(v -> {
                if (!ThemeManager.isDarkTheme(this)) {
                    ThemeManager.setDarkTheme(this, true);
                }

                updateThemeToggle();
            });
        }

        updateThemeToggle();
    }

    private void updateThemeToggle() {
        boolean dark = ThemeManager.isDarkTheme(this);

        TextView btnLight = findViewById(R.id.btn_theme_light);
        TextView btnDark = findViewById(R.id.btn_theme_dark);

        try {
            if (btnLight != null) {
                btnLight.setBackgroundResource(
                        dark
                                ? R.drawable.bg_pill_tab_unselected
                                : R.drawable.bg_pill_tab_selected
                );

                btnLight.setTextColor(
                        getResources().getColor(
                                dark
                                        ? R.color.neuro_tab_text_unselected
                                        : R.color.neuro_tab_text_selected
                        )
                );
            }

            if (btnDark != null) {
                btnDark.setBackgroundResource(
                        dark
                                ? R.drawable.bg_pill_tab_selected
                                : R.drawable.bg_pill_tab_unselected
                );

                btnDark.setTextColor(
                        getResources().getColor(
                                dark
                                        ? R.color.neuro_tab_text_selected
                                        : R.color.neuro_tab_text_unselected
                        )
                );
            }
        } catch (Exception ignored) {
        }
    }

    private void showLogoutConfirmation() {
        new AlertDialog.Builder(this)
                .setTitle("Sign Out")
                .setMessage(
                        "Are you sure you want to sign out of your account?"
                )
                .setPositiveButton(
                        "Sign Out",
                        (dialog, which) -> performLogout()
                )
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void performLogout() {
        sessionManager.logout();

        Intent intent = new Intent(
                this,
                LoginActivity.class
        );

        intent.setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TASK
        );

        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();

        if (sessionManager != null) {
            sessionManager.close();
        }
    }
}
```
