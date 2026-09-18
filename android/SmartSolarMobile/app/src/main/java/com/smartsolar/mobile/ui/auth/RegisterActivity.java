// ============================================================================
// File: RegisterActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Solar Prosumer registration screen with form validation
// ============================================================================

package com.smartsolar.mobile.ui.auth;

import android.os.Bundle;
import android.view.View;
import android.widget.*;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import android.text.Editable;
import android.text.TextWatcher;

import com.google.android.material.button.MaterialButton;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.util.PasswordValidator;

/**
 * Prosumer Registration Screen.
 * Handles user registration form and real-time password strength validation.
 */
public class RegisterActivity extends AppCompatActivity {

    // ── Form fields ───────────────────────────────────────────────────────────

    private EditText etNic, etFullName, etEmail, etPassword, etPhone, etAddress;

    private MaterialButton btnRegister, btnPickLocation;

    private TextView tvError, tvSuccess, tvSelectedLocation;

    private View progressBar;

    // ── Password Strength UI ──────────────────────────────────────────────────

    private LinearLayout layoutPasswordStrength;

    private TextView tvPasswordStrengthLabel;

    private ProgressBar pbPasswordStrength;

    private TextView tvRuleLength, tvRuleUpper, tvRuleLower,
            tvRuleDigit, tvRuleSpecial;


    @Override
    protected void onCreate(Bundle savedInstanceState) {

        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_register);

        bindViews();

        setupPasswordStrengthWatcher();

        wireButtons();
    }


    // ── Bind all UI views ─────────────────────────────────────────────────────

    private void bindViews() {

        etNic              = findViewById(R.id.et_nic);
        etFullName         = findViewById(R.id.et_full_name);
        etEmail            = findViewById(R.id.et_email);
        etPassword         = findViewById(R.id.et_password);
        etPhone            = findViewById(R.id.et_phone);
        etAddress          = findViewById(R.id.et_address);

        btnRegister        = findViewById(R.id.btn_register);
        btnPickLocation    = findViewById(R.id.btn_pick_location);

        tvError            = findViewById(R.id.tv_error);
        tvSuccess          = findViewById(R.id.tv_success);
        tvSelectedLocation = findViewById(R.id.tv_selected_location);

        progressBar        = findViewById(R.id.progress_bar);

        layoutPasswordStrength =
                findViewById(R.id.layout_password_strength);

        tvPasswordStrengthLabel =
                findViewById(R.id.tv_password_strength_label);

        pbPasswordStrength =
                findViewById(R.id.pb_password_strength);

        tvRuleLength =
                findViewById(R.id.tv_rule_length);

        tvRuleUpper =
                findViewById(R.id.tv_rule_upper);

        tvRuleLower =
                findViewById(R.id.tv_rule_lower);

        tvRuleDigit =
                findViewById(R.id.tv_rule_digit);

        tvRuleSpecial =
                findViewById(R.id.tv_rule_special);
    }


    // ── Configure password strength real-time watcher ─────────────────────────

    private void setupPasswordStrengthWatcher() {

        // [IT22106292] - Real-time password strength validation

        etPassword.addTextChangedListener(new TextWatcher() {

            @Override
            public void beforeTextChanged(
                    CharSequence s,
                    int start,
                    int count,
                    int after) {
            }


            @Override
            public void onTextChanged(
                    CharSequence s,
                    int start,
                    int before,
                    int count) {
            }


            @Override
            public void afterTextChanged(Editable s) {

                String pass = s != null ? s.toString() : "";

                if (pass.isEmpty()) {

                    layoutPasswordStrength.setVisibility(View.GONE);

                    return;
                }

                layoutPasswordStrength.setVisibility(View.VISIBLE);


                boolean hasLen =
                        PasswordValidator.hasMinLength(pass);

                boolean hasUp =
                        PasswordValidator.hasUpper(pass);

                boolean hasLow =
                        PasswordValidator.hasLower(pass);

                boolean hasDig =
                        PasswordValidator.hasDigit(pass);

                boolean hasSpec =
                        PasswordValidator.hasSpecial(pass);


                updateRuleView(
                        tvRuleLength,
                        hasLen,
                        "At least 8 characters"
                );

                updateRuleView(
                        tvRuleUpper,
                        hasUp,
                        "Uppercase letter (A-Z)"
                );

                updateRuleView(
                        tvRuleLower,
                        hasLow,
                        "Lowercase letter (a-z)"
                );

                updateRuleView(
                        tvRuleDigit,
                        hasDig,
                        "Number (0-9)"
                );

                updateRuleView(
                        tvRuleSpecial,
                        hasSpec,
                        "Special character (!@#$%...)"
                );


                int score =
                        PasswordValidator.getScore(pass);

                pbPasswordStrength.setProgress(score);


                int colorGreen =
                        ContextCompat.getColor(
                                RegisterActivity.this,
                                R.color.neuro_text_green
                        );

                int colorAmber =
                        ContextCompat.getColor(
                                RegisterActivity.this,
                                R.color.neuro_amber
                        );

                int colorDanger =
                        ContextCompat.getColor(
                                RegisterActivity.this,
                                R.color.neuro_danger
                        );


                if (score == 5) {

                    tvPasswordStrengthLabel.setText(
                            "Strength: Strong"
                    );

                    tvPasswordStrengthLabel.setTextColor(
                            colorGreen
                    );

                    pbPasswordStrength.setProgressTintList(
                            android.content.res.ColorStateList.valueOf(
                                    colorGreen
                            )
                    );

                } else if (score >= 3) {

                    tvPasswordStrengthLabel.setText(
                            "Strength: Medium"
                    );

                    tvPasswordStrengthLabel.setTextColor(
                            colorAmber
                    );

                    pbPasswordStrength.setProgressTintList(
                            android.content.res.ColorStateList.valueOf(
                                    colorAmber
                            )
                    );

                } else {

                    tvPasswordStrengthLabel.setText(
                            "Strength: Weak"
                    );

                    tvPasswordStrengthLabel.setTextColor(
                            colorDanger
                    );

                    pbPasswordStrength.setProgressTintList(
                            android.content.res.ColorStateList.valueOf(
                                    colorDanger
                            )
                    );
                }
            }
        });
    }


    private void updateRuleView(
            TextView tv,
            boolean met,
            String text) {

        if (met) {

            tv.setText("✓ " + text);

            tv.setTextColor(
                    ContextCompat.getColor(
                            this,
                            R.color.neuro_text_green
                    )
            );

        } else {

            tv.setText("○ " + text);

            tv.setTextColor(
                    ContextCompat.getColor(
                            this,
                            R.color.neuro_text_muted
                    )
            );
        }
    }


    // ── Wire button listeners ─────────────────────────────────────────────────

    private void wireButtons() {

        // [IT22106292] - Registration button handling

        btnRegister.setOnClickListener(
                v -> performRegistration()
        );

        btnPickLocation.setOnClickListener(
                v -> {
                    // Map functionality added in next commit
                }
        );
    }


    // ── Validate form and register user ───────────────────────────────────────

    private void performRegistration() {

        String nic =
                etNic.getText().toString().trim();

        String name =
                etFullName.getText().toString().trim();

        String email =
                etEmail.getText().toString().trim();

        String pass =
                etPassword.getText().toString().trim();

        String phone =
                etPhone.getText().toString().trim();

        String address =
                etAddress.getText().toString().trim();


        if (nic.isEmpty()
                || name.isEmpty()
                || email.isEmpty()
                || pass.isEmpty()
                || phone.isEmpty()) {

            showError(
                    "NIC, Full Name, Email, Password and Phone are required."
            );

            return;
        }


        if (!PasswordValidator.isStrong(pass)) {

            showError(
                    "Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols."
            );

            return;
        }


        tvError.setVisibility(View.GONE);

        tvSuccess.setVisibility(View.GONE);

        progressBar.setVisibility(View.VISIBLE);

        btnRegister.setEnabled(false);


        // API registration functionality added in next commit
    }


    private void showError(String msg) {

        progressBar.setVisibility(View.GONE);

        tvError.setText(msg);

        tvError.setVisibility(View.VISIBLE);
    }
}