```java
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.*;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.data.ThemeManager;
import com.smartsolar.mobile.ui.auth.LoginActivity;

import okhttp3.Request;
import okhttp3.Response;

import org.json.JSONObject;

public class SettingsActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    private AlertDialog resetDialog;
    private String resetOtpEntered = "";
    private CountDownTimer resetCountDown;

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

        View btnResetPw = findViewById(R.id.btn_reset_password);

        if (btnResetPw != null) {
            btnResetPw.setOnClickListener(
                    v -> showResetStep1()
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

    private void showResetStep1() {
        View view = getLayoutInflater().inflate(
                R.layout.dialog_reset_step1, null
        );

        EditText etId = view.findViewById(
                R.id.et_reset_identifier
        );

        TextView tvErr = view.findViewById(
                R.id.tv_reset_error
        );

        View pb = view.findViewById(R.id.pb_reset);

        String preId = sessionManager.getEmail();

        if (preId == null || preId.isEmpty()) {
            preId = sessionManager.getNic();
        }

        if (etId != null && preId != null) {
            etId.setText(preId);
        }

        resetDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(true)
                .create();

        resetDialog.show();

        final String[] identifier = {
                preId != null ? preId : ""
        };

        view.findViewById(R.id.btn_reset_send_otp)
                .setOnClickListener(v -> {
                    String id = etId.getText().toString().trim();

                    if (id.isEmpty()) {
                        tvErr.setText("Email / NIC is required.");
                        tvErr.setVisibility(View.VISIBLE);
                        return;
                    }

                    identifier[0] = id;
                    tvErr.setVisibility(View.GONE);
                    pb.setVisibility(View.VISIBLE);
                    v.setEnabled(false);

                    new Thread(() -> {
                        try {
                            JSONObject body = new JSONObject();
                            body.put("emailOrNic", id);

                            Request request = new Request.Builder()
                                    .url(
                                            ApiClient.BASE_URL
                                                    + "auth/request-password-reset-otp"
                                    )
                                    .post(ApiClient.jsonBody(body))
                                    .addHeader(
                                            "Content-Type",
                                            "application/json"
                                    )
                                    .build();

                            try (Response response =
                                         ApiClient.getClient()
                                                 .newCall(request)
                                                 .execute()) {

                                String responseBody =
                                        response.body() != null
                                                ? response.body().string()
                                                : "{}";

                                JSONObject json =
                                        new JSONObject(responseBody);

                                if (response.isSuccessful()) {
                                    String masked = json.optString(
                                            "maskedEmail", id
                                    );

                                    runOnUiThread(() -> {
                                        resetDialog.dismiss();
                                        showResetStep2(
                                                identifier[0], masked
                                        );
                                    });
                                } else {
                                    String message = json.optString(
                                            "message",
                                            "Failed to send OTP."
                                    );

                                    runOnUiThread(() -> {
                                        tvErr.setText(message);
                                        tvErr.setVisibility(View.VISIBLE);
                                        pb.setVisibility(View.GONE);
                                        v.setEnabled(true);
                                    });
                                }
                            }
                        } catch (Exception e) {
                            runOnUiThread(() -> {
                                tvErr.setText("Network error.");
                                tvErr.setVisibility(View.VISIBLE);
                                pb.setVisibility(View.GONE);
                                v.setEnabled(true);
                            });
                        }
                    }).start();
                });
    }

    private void showResetStep2(
            String identifier,
            String maskedEmail
    ) {
        View view = getLayoutInflater().inflate(
                R.layout.dialog_reset_step2, null
        );

        EditText etOtp = view.findViewById(
                R.id.et_reset_otp
        );

        TextView tvErr = view.findViewById(
                R.id.tv_reset_error2
        );

        TextView tvTimer = view.findViewById(
                R.id.tv_otp_timer
        );

        TextView tvSent = view.findViewById(
                R.id.tv_otp_sent_to
        );

        View pb = view.findViewById(R.id.pb_reset2);

        if (tvSent != null) {
            tvSent.setText("Code sent to " + maskedEmail);
        }

        resetDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(false)
                .create();

        resetDialog.show();

        resetCountDown = new CountDownTimer(
                5 * 60 * 1000L, 1000
        ) {
            @Override
            public void onTick(long ms) {
                long seconds = ms / 1000;

                runOnUiThread(() -> {
                    if (tvTimer != null) {
                        tvTimer.setText(
                                String.format(
                                        "%02d:%02d",
                                        seconds / 60,
                                        seconds % 60
                                )
                        );
                    }
                });
            }

            @Override
            public void onFinish() {
                runOnUiThread(() -> {
                    if (tvTimer != null) {
                        tvTimer.setText("00:00 – Expired");
                    }
                });
            }
        }.start();

        view.findViewById(R.id.btn_reset_verify_otp)
                .setOnClickListener(v -> {
                    String otp = etOtp.getText().toString().trim();

                    if (otp.length() != 6) {
                        tvErr.setText("Enter the 6-digit code.");
                        tvErr.setVisibility(View.VISIBLE);
                        return;
                    }

                    resetOtpEntered = otp;
                    tvErr.setVisibility(View.GONE);
                    pb.setVisibility(View.VISIBLE);
                    v.setEnabled(false);

                    new Thread(() -> {
                        try {
                            JSONObject body = new JSONObject();
                            body.put("emailOrNic", identifier);
                            body.put("otp", otp);

                            Request request = new Request.Builder()
                                    .url(
                                            ApiClient.BASE_URL
                                                    + "auth/verify-password-reset-otp"
                                    )
                                    .post(ApiClient.jsonBody(body))
                                    .addHeader(
                                            "Content-Type",
                                            "application/json"
                                    )
                                    .build();

                            try (Response response =
                                         ApiClient.getClient()
                                                 .newCall(request)
                                                 .execute()) {

                                String responseBody =
                                        response.body() != null
                                                ? response.body().string()
                                                : "{}";

                                JSONObject json =
                                        new JSONObject(responseBody);

                                if (response.isSuccessful()) {
                                    runOnUiThread(() -> {
                                        if (resetCountDown != null) {
                                            resetCountDown.cancel();
                                        }

                                        resetDialog.dismiss();

                                        showResetStep3(
                                                identifier, otp
                                        );
                                    });
                                } else {
                                    String message = json.optString(
                                            "message",
                                            "Invalid or expired code."
                                    );

                                    runOnUiThread(() -> {
                                        tvErr.setText(message);
                                        tvErr.setVisibility(View.VISIBLE);
                                        pb.setVisibility(View.GONE);
                                        v.setEnabled(true);
                                    });
                                }
                            }
                        } catch (Exception e) {
                            runOnUiThread(() -> {
                                tvErr.setText("Network error.");
                                tvErr.setVisibility(View.VISIBLE);
                                pb.setVisibility(View.GONE);
                                v.setEnabled(true);
                            });
                        }
                    }).start();
                });

        View btnResend = view.findViewById(R.id.btn_resend_otp);

        if (btnResend != null) {
            btnResend.setOnClickListener(v -> {
                if (resetCountDown != null) {
                    resetCountDown.cancel();
                }

                resetDialog.dismiss();
                showResetStep1();
            });
        }
    }

    private void showResetStep3(
            String identifier,
            String otp
    ) {
        View view = getLayoutInflater().inflate(
                R.layout.dialog_reset_step3, null
        );

        EditText etNew = view.findViewById(
                R.id.et_new_password
        );

        EditText etConfirm = view.findViewById(
                R.id.et_confirm_password
        );

        TextView tvErr = view.findViewById(
                R.id.tv_reset_error3
        );

        View pb = view.findViewById(R.id.pb_reset3);

        resetDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(false)
                .create();

        resetDialog.show();

        view.findViewById(R.id.btn_reset_confirm)
                .setOnClickListener(v -> {
                    String newPw = etNew.getText().toString().trim();
                    String confPw = etConfirm.getText().toString().trim();

                    if (newPw.length() < 6) {
                        tvErr.setText(
                                "Password must be at least 6 characters."
                        );
                        tvErr.setVisibility(View.VISIBLE);
                        return;
                    }

                    if (!newPw.equals(confPw)) {
                        tvErr.setText("Passwords do not match.");
                        tvErr.setVisibility(View.VISIBLE);
                        return;
                    }

                    tvErr.setVisibility(View.GONE);
                    pb.setVisibility(View.VISIBLE);
                    v.setEnabled(false);

                    new Thread(() -> {
                        try {
                            JSONObject body = new JSONObject();
                            body.put("emailOrNic", identifier);
                            body.put("otp", otp);
                            body.put("newPassword", newPw);
                            body.put("confirmPassword", confPw);

                            Request request = new Request.Builder()
                                    .url(
                                            ApiClient.BASE_URL
                                                    + "auth/confirm-password-reset"
                                    )
                                    .post(ApiClient.jsonBody(body))
                                    .addHeader(
                                            "Content-Type",
                                            "application/json"
                                    )
                                    .build();

                            try (Response response =
                                         ApiClient.getClient()
                                                 .newCall(request)
                                                 .execute()) {

                                String responseBody =
                                        response.body() != null
                                                ? response.body().string()
                                                : "{}";

                                JSONObject json =
                                        new JSONObject(responseBody);

                                if (response.isSuccessful()) {
                                    runOnUiThread(() -> {
                                        resetDialog.dismiss();

                                        Toast.makeText(
                                                this,
                                                "Password changed successfully.",
                                                Toast.LENGTH_LONG
                                        ).show();
                                    });
                                } else {
                                    String message = json.optString(
                                            "message",
                                            "Failed to reset password."
                                    );

                                    runOnUiThread(() -> {
                                        tvErr.setText(message);
                                        tvErr.setVisibility(View.VISIBLE);
                                        pb.setVisibility(View.GONE);
                                        v.setEnabled(true);
                                    });
                                }
                            }
                        } catch (Exception e) {
                            runOnUiThread(() -> {
                                tvErr.setText("Network error.");
                                tvErr.setVisibility(View.VISIBLE);
                                pb.setVisibility(View.GONE);
                                v.setEnabled(true);
                            });
                        }
                    }).start();
                });
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

        if (resetCountDown != null) {
            resetCountDown.cancel();
        }

        if (resetDialog != null && resetDialog.isShowing()) {
            resetDialog.dismiss();
        }
    }
}
```
