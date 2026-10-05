// ============================================================================
// File: LoginActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Authentication Activity. Calls C# Web API /auth/login, stores
//              JWT and user profile in SQLite, then routes Prosumer or Operator.
//              Includes Forgot Password OTP flow (3-step: Email → OTP → Reset).
// Architecture: FAT Service Pattern - All auth logic centralized in C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.DatabaseHelper;
import com.smartsolar.mobile.data.SessionManager;
import com.smartsolar.mobile.ui.operator.OperatorMainActivity;
import com.smartsolar.mobile.ui.prosumer.ProsumerMainActivity;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

/** Login screen for Solar Prosumers and Grid Operators. */
public class LoginActivity extends AppCompatActivity {

    // ── UI Components ────────────────────────────────────────────────────────
    private EditText etEmailOrNic, etPassword;
    private Button btnLogin;
    private TextView tvRegister, tvError, tvForgotPassword;
    private View progressBar;
    private DatabaseHelper dbHelper;

    // ── Forgot Password State ─────────────────────────────────────────────────
    private AlertDialog forgotDialog;
    private int forgotStep = 1;           // 1: email, 2: OTP, 3: new password
    private String forgotIdentifier = ""; // email / NIC used across steps
    private String forgotOtpEntered = "";
    private CountDownTimer countDownTimer;

    /** Called on activity creation - sets up login form. */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise SQLite database helper, auto-redirect if session exists, and bind form UI components
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        dbHelper = new DatabaseHelper(this);

        // Auto-redirect if session exists in SQLite
        SessionManager session = new SessionManager(this);
        if (session.isLoggedIn()) {
            routeByRole(session.getRole());
            session.close();
            return;
        }
        session.close();

        // Bind UI components
        etEmailOrNic   = findViewById(R.id.et_email_or_nic);
        etPassword     = findViewById(R.id.et_password);
        btnLogin       = findViewById(R.id.btn_login);
        tvRegister     = findViewById(R.id.tv_register_link);
        tvError        = findViewById(R.id.tv_error);
        progressBar    = findViewById(R.id.progress_bar);
        tvForgotPassword = findViewById(R.id.tv_forgot_password);

        // Set login button click listener
        btnLogin.setOnClickListener(v -> performLogin());

        // Navigate to prosumer registration screen
        tvRegister.setOnClickListener(v ->
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class))
        );

        // Open forgot-password flow
        if (tvForgotPassword != null) {
            tvForgotPassword.setOnClickListener(v -> showForgotPasswordStep1());
        }

        applyEntranceMotion();
    }

    /** Structured entrance motion: logo pops, brand text rises, form card and actions rise. */
    private void applyEntranceMotion() {
        // [IT22106292] - Applies animated entrance transitions for login UI
        // Logo pop-in, staggered rise for brand text, form card and login button
        try {
            android.view.animation.Animation logoPop =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.login_logo_pop);
            android.view.animation.Animation textRise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.login_text_rise);
            android.view.animation.Animation rise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
            View logo = findViewById(R.id.login_logo_badge);
            if (logo != null) logo.startAnimation(logoPop);
            View brand = findViewById(R.id.login_brand_block);
            if (brand != null) {
                textRise.setStartOffset(150);
                brand.startAnimation(textRise);
            }
            View form = findViewById(R.id.login_form_card);
            if (form != null) {
                android.view.animation.Animation formRise =
                        android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
                formRise.setStartOffset(250);
                form.startAnimation(formRise);
            }
            View loginBtn = findViewById(R.id.btn_login);
            if (loginBtn != null) {
                android.view.animation.Animation btnRise =
                        android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
                btnRise.setStartOffset(350);
                loginBtn.startAnimation(btnRise);
            }
        } catch (Exception ignored) {}
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /** Authenticates user credentials against the central C# Web API. */
    private void performLogin() {
        // [IT22106292] - Sends login request and routes user to role-based home screen
        // Validate inputs, call /auth/login API endpoint, persist JWT session and route by role
        String identifier = etEmailOrNic.getText().toString().trim();
        String password   = etPassword.getText().toString().trim();

        if (identifier.isEmpty() || password.isEmpty()) {
            tvError.setText("Please enter your Email/NIC and Password.");
            tvError.setVisibility(View.VISIBLE);
            return;
        }

        tvError.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);
        btnLogin.setEnabled(false);

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("emailOrNic", identifier);
                body.put("password", password);

                Request request = new Request.Builder()
                        .url(ApiClient.BASE_URL + "auth/login")
                        .post(ApiClient.jsonBody(body))
                        .addHeader("Content-Type", "application/json")
                        .build();

                Response response = ApiClient.getClient().newCall(request).execute();
                String responseBody = response.body().string();
                JSONObject json = new JSONObject(responseBody);

                if (response.isSuccessful()) {
                    // Store session in SQLite
                    dbHelper.saveSession(
                        json.optString("nic"),
                        json.optString("fullName"),
                        json.optString("email"),
                        json.optString("role"),
                        json.optString("status"),
                        json.optString("token")
                    );
                    String role = json.optString("role");
                    runOnUiThread(() -> routeByRole(role));
                } else {
                    String msg = json.optString("message", "Login failed. Check credentials.");
                    runOnUiThread(() -> {
                        tvError.setText(msg);
                        tvError.setVisibility(View.VISIBLE);
                        progressBar.setVisibility(View.GONE);
                        btnLogin.setEnabled(true);
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    tvError.setText("Network error. Is the Smart Solar API running?");
                    tvError.setVisibility(View.VISIBLE);
                    progressBar.setVisibility(View.GONE);
                    btnLogin.setEnabled(true);
                });
            }
        }).start();
    }

    // ── Forgot Password Flow ──────────────────────────────────────────────────

    /** Step 1: ask for email / NIC and dispatch OTP. */
    private void showForgotPasswordStep1() {
        // Inflate step-1 dialog and dispatch OTP to the provided email or NIC identifier
        forgotStep = 1;
        View view = getLayoutInflater().inflate(R.layout.dialog_reset_step1, null);
        EditText etId = view.findViewById(R.id.et_reset_identifier);
        TextView tvErr = view.findViewById(R.id.tv_reset_error);
        View pb = view.findViewById(R.id.pb_reset);

        forgotDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(true)
                .create();
        forgotDialog.show();

        view.findViewById(R.id.btn_reset_send_otp).setOnClickListener(v -> {
            String id = etId.getText().toString().trim();
            if (id.isEmpty()) { tvErr.setText("Please enter your Email or NIC."); tvErr.setVisibility(View.VISIBLE); return; }
            forgotIdentifier = id;
            tvErr.setVisibility(View.GONE);
            pb.setVisibility(View.VISIBLE);
            v.setEnabled(false);

            new Thread(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("emailOrNic", id);
                    Request req = new Request.Builder()
                            .url(ApiClient.BASE_URL + "auth/request-password-reset-otp")
                            .post(ApiClient.jsonBody(body))
                            .addHeader("Content-Type", "application/json")
                            .build();
                    Response res = ApiClient.getClient().newCall(req).execute();
                    JSONObject json = new JSONObject(res.body().string());
                    if (res.isSuccessful()) {
                        String masked = json.optString("maskedEmail", id);
                        runOnUiThread(() -> {
                            forgotDialog.dismiss();
                            showForgotPasswordStep2(masked);
                        });
                    } else {
                        String msg = json.optString("message", "Could not send OTP. Check Email / NIC.");
                        runOnUiThread(() -> { tvErr.setText(msg); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                    }
                } catch (Exception e) {
                    runOnUiThread(() -> { tvErr.setText("Network error."); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                }
            }).start();
        });
    }

    /** Step 2: show 5-min countdown and OTP entry. */
    private void showForgotPasswordStep2(String maskedEmail) {
        // Inflate step-2 dialog, start 5-minute countdown timer, and verify the 6-digit OTP code
        forgotStep = 2;
        View view = getLayoutInflater().inflate(R.layout.dialog_reset_step2, null);
        EditText etOtp   = view.findViewById(R.id.et_reset_otp);
        TextView tvErr   = view.findViewById(R.id.tv_reset_error2);
        TextView tvTimer = view.findViewById(R.id.tv_otp_timer);
        View pb   = view.findViewById(R.id.pb_reset2);
        TextView tvSent  = view.findViewById(R.id.tv_otp_sent_to);
        if (tvSent != null) tvSent.setText("Code sent to " + maskedEmail);

        forgotDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(false)
                .create();
        forgotDialog.show();

        // 5-minute countdown
        countDownTimer = new CountDownTimer(5 * 60 * 1000L, 1000) {
            @Override public void onTick(long ms) {
                long totalSecs = ms / 1000;
                String time = String.format("%02d:%02d", totalSecs / 60, totalSecs % 60);
                runOnUiThread(() -> { if (tvTimer != null) tvTimer.setText(time); });
            }
            @Override public void onFinish() {
                runOnUiThread(() -> { if (tvTimer != null) tvTimer.setText("00:00 – Expired"); });
            }
        }.start();

        view.findViewById(R.id.btn_reset_verify_otp).setOnClickListener(v -> {
            String otp = etOtp.getText().toString().trim();
            if (otp.length() != 6) { tvErr.setText("Enter the 6-digit code."); tvErr.setVisibility(View.VISIBLE); return; }
            forgotOtpEntered = otp;
            tvErr.setVisibility(View.GONE);
            pb.setVisibility(View.VISIBLE);
            v.setEnabled(false);

            new Thread(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("emailOrNic", forgotIdentifier);
                    body.put("otp", otp);
                    Request req = new Request.Builder()
                            .url(ApiClient.BASE_URL + "auth/verify-password-reset-otp")
                            .post(ApiClient.jsonBody(body))
                            .addHeader("Content-Type", "application/json")
                            .build();
                    Response res = ApiClient.getClient().newCall(req).execute();
                    JSONObject json = new JSONObject(res.body().string());
                    if (res.isSuccessful()) {
                        runOnUiThread(() -> {
                            countDownTimer.cancel();
                            forgotDialog.dismiss();
                            showForgotPasswordStep3();
                        });
                    } else {
                        String msg = json.optString("message", "Invalid or expired code.");
                        runOnUiThread(() -> { tvErr.setText(msg); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                    }
                } catch (Exception e) {
                    runOnUiThread(() -> { tvErr.setText("Network error."); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                }
            }).start();
        });

        // Resend OTP
        View btnResend = view.findViewById(R.id.btn_resend_otp);
        if (btnResend != null) btnResend.setOnClickListener(v -> {
            countDownTimer.cancel(); forgotDialog.dismiss(); showForgotPasswordStep1();
        });
    }

    /** Step 3: enter and confirm new password. */
    private void showForgotPasswordStep3() {
        // Inflate step-3 dialog and call /auth/confirm-password-reset to commit the new password
        forgotStep = 3;
        View view = getLayoutInflater().inflate(R.layout.dialog_reset_step3, null);
        EditText etNew     = view.findViewById(R.id.et_new_password);
        EditText etConfirm = view.findViewById(R.id.et_confirm_password);
        TextView tvErr     = view.findViewById(R.id.tv_reset_error3);
        View pb     = view.findViewById(R.id.pb_reset3);

        forgotDialog = new AlertDialog.Builder(this)
                .setView(view)
                .setCancelable(false)
                .create();
        forgotDialog.show();

        view.findViewById(R.id.btn_reset_confirm).setOnClickListener(v -> {
            String newPw  = etNew.getText().toString().trim();
            String confPw = etConfirm.getText().toString().trim();
            if (newPw.length() < 6) { tvErr.setText("Password must be at least 6 characters."); tvErr.setVisibility(View.VISIBLE); return; }
            if (!newPw.equals(confPw)) { tvErr.setText("Passwords do not match."); tvErr.setVisibility(View.VISIBLE); return; }
            tvErr.setVisibility(View.GONE);
            pb.setVisibility(View.VISIBLE);
            v.setEnabled(false);

            new Thread(() -> {
                try {
                    JSONObject body = new JSONObject();
                    body.put("emailOrNic", forgotIdentifier);
                    body.put("otp", forgotOtpEntered);
                    body.put("newPassword", newPw);
                    body.put("confirmPassword", confPw);
                    Request req = new Request.Builder()
                            .url(ApiClient.BASE_URL + "auth/confirm-password-reset")
                            .post(ApiClient.jsonBody(body))
                            .addHeader("Content-Type", "application/json")
                            .build();
                    Response res = ApiClient.getClient().newCall(req).execute();
                    JSONObject json = new JSONObject(res.body().string());
                    if (res.isSuccessful()) {
                        runOnUiThread(() -> {
                            forgotDialog.dismiss();
                            Toast.makeText(this, "Password reset successful. Please log in.", Toast.LENGTH_LONG).show();
                            etEmailOrNic.setText(forgotIdentifier);
                            etPassword.setText("");
                        });
                    } else {
                        String msg = json.optString("message", "Failed to reset password.");
                        runOnUiThread(() -> { tvErr.setText(msg); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                    }
                } catch (Exception e) {
                    runOnUiThread(() -> { tvErr.setText("Network error."); tvErr.setVisibility(View.VISIBLE); pb.setVisibility(View.GONE); v.setEnabled(true); });
                }
            }).start();
        });
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    /** Routes authenticated user to appropriate home activity based on role. */
    private void routeByRole(String role) {
        // [IT22106292] - Routes authenticated user to role-specific home screen
        // Clear back stack and navigate to GridOperator or Prosumer dashboard based on role
        Intent intent;
        if ("GridOperator".equals(role)) {
            intent = new Intent(LoginActivity.this, OperatorMainActivity.class);
        } else {
            intent = new Intent(LoginActivity.this, ProsumerMainActivity.class);
        }
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        // Release SQLite helper, cancel countdown timer and dismiss any open forgot-password dialog
        super.onDestroy();
        if (dbHelper != null) dbHelper.close();
        if (countDownTimer != null) countDownTimer.cancel();
        if (forgotDialog != null && forgotDialog.isShowing()) forgotDialog.dismiss();
    }
}
