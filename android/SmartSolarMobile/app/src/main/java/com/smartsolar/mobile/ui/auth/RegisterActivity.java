// ============================================================================
// File: RegisterActivity.java
// Author: IT22106292
// Course: SE4040 - Enterprise Application Development
// Description: Solar Prosumer registration screen. Uses NIC as primary key.
//              Calls POST /api/auth/register on the C# Web API.
//              Account is created with PendingApproval status - Backoffice activates.
//              Includes OSMDroid interactive map to select solar installation GPS.
// Architecture: FAT Service Pattern - Validation and status enforcement in API
// ============================================================================
package com.smartsolar.mobile.ui.auth;

import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.location.Address;
import android.location.Geocoder;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import android.text.Editable;
import android.text.TextWatcher;
import com.google.android.material.button.MaterialButton;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.util.PasswordValidator;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.osmdroid.config.Configuration;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.Marker;
import java.net.URLEncoder;
import java.util.List;
import java.util.Locale;

/** Prosumer Registration Screen with OSMDroid interactive map to select installation GPS. */
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
    private TextView tvRuleLength, tvRuleUpper, tvRuleLower, tvRuleDigit, tvRuleSpecial;

    // ── Map preview (mini embedded map in registration card) ──────────────────
    private MapView mapPreview;
    private Marker previewMarker;

    // ── Selected GPS coordinates from map picker ───────────────────────────────
    private Double selectedLat = null;
    private Double selectedLng = null;

    // Default centre: Sri Lanka
    private static final double DEFAULT_LAT = 7.8731;
    private static final double DEFAULT_LNG = 80.7718;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Configure OSMDroid, inflate layout, bind views, setup password watcher, map, and buttons
        super.onCreate(savedInstanceState);

        // OSMDroid config must happen before setContentView
        Configuration.getInstance().load(this, getPreferences(MODE_PRIVATE));
        Configuration.getInstance().setUserAgentValue(getPackageName());

        setContentView(R.layout.activity_register);

        bindViews();
        setupPasswordStrengthWatcher();
        setupMapPreview();
        wireButtons();
        applyEntranceMotion();
    }

    // ── Entrance motion: header fades, logo pops, title + sheet rise ─────────
    private void applyEntranceMotion() {
        try {
            android.view.animation.Animation fade =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in);
            android.view.animation.Animation logoPop =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.login_logo_pop);
            android.view.animation.Animation textRise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.login_text_rise);
            android.view.animation.Animation sheetRise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);

            View header = findViewById(R.id.register_header);
            if (header != null) header.startAnimation(fade);
            View logo = findViewById(R.id.register_logo_badge);
            if (logo != null) logo.startAnimation(logoPop);
            View title = findViewById(R.id.register_title);
            if (title != null) {
                textRise.setStartOffset(150);
                title.startAnimation(textRise);
            }
            View sheet = findViewById(R.id.register_sheet);
            if (sheet != null) {
                sheetRise.setStartOffset(200);
                sheet.startAnimation(sheetRise);
            }
            if (btnRegister != null) {
                android.view.animation.Animation btnRise =
                        android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
                btnRise.setStartOffset(350);
                btnRegister.startAnimation(btnRise);
            }
        } catch (Exception ignored) {}
    }

    // ── Bind all UI views ─────────────────────────────────────────────────────
    private void bindViews() {
        // Locate and assign all EditText, Button, TextView, and ProgressBar references by ID
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
        mapPreview         = findViewById(R.id.map_preview);

        layoutPasswordStrength  = findViewById(R.id.layout_password_strength);
        tvPasswordStrengthLabel = findViewById(R.id.tv_password_strength_label);
        pbPasswordStrength      = findViewById(R.id.pb_password_strength);
        tvRuleLength            = findViewById(R.id.tv_rule_length);
        tvRuleUpper             = findViewById(R.id.tv_rule_upper);
        tvRuleLower             = findViewById(R.id.tv_rule_lower);
        tvRuleDigit             = findViewById(R.id.tv_rule_digit);
        tvRuleSpecial           = findViewById(R.id.tv_rule_special);
    }

    // ── Configure the mini preview map ────────────────────────────────────────
    private void setupMapPreview() {
        // Initialise mini OSMDroid map centred on Sri Lanka for GPS solar installation selection
        if (mapPreview == null) return;
        mapPreview.setTileSource(TileSourceFactory.MAPNIK);
        mapPreview.setBuiltInZoomControls(false);
        mapPreview.setMultiTouchControls(true);
        mapPreview.getController().setZoom(7.0);
        mapPreview.getController().setCenter(new GeoPoint(DEFAULT_LAT, DEFAULT_LNG));
    }

    // ── Configure password strength real-time watcher ───────────────────────
    private void setupPasswordStrengthWatcher() {
        // [IT22106292] - Sets up real-time password strength validation watcher
        // Register TextWatcher on password field to evaluate strength criteria in real time
        etPassword.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}

            @Override
            public void afterTextChanged(Editable s) {
                String pass = s != null ? s.toString() : "";
                if (pass.isEmpty()) {
                    layoutPasswordStrength.setVisibility(View.GONE);
                    return;
                }
                layoutPasswordStrength.setVisibility(View.VISIBLE);

                boolean hasLen = PasswordValidator.hasMinLength(pass);
                boolean hasUp = PasswordValidator.hasUpper(pass);
                boolean hasLow = PasswordValidator.hasLower(pass);
                boolean hasDig = PasswordValidator.hasDigit(pass);
                boolean hasSpec = PasswordValidator.hasSpecial(pass);

                updateRuleView(tvRuleLength, hasLen, "At least 8 characters");
                updateRuleView(tvRuleUpper, hasUp, "Uppercase letter (A-Z)");
                updateRuleView(tvRuleLower, hasLow, "Lowercase letter (a-z)");
                updateRuleView(tvRuleDigit, hasDig, "Number (0-9)");
                updateRuleView(tvRuleSpecial, hasSpec, "Special character (!@#$%...)");

                int score = PasswordValidator.getScore(pass);
                pbPasswordStrength.setProgress(score);

                int colorGreen = ContextCompat.getColor(RegisterActivity.this, R.color.neuro_text_green);
                int colorAmber = ContextCompat.getColor(RegisterActivity.this, R.color.neuro_amber);
                int colorDanger = ContextCompat.getColor(RegisterActivity.this, R.color.neuro_danger);

                if (score == 5) {
                    tvPasswordStrengthLabel.setText("Strength: Strong");
                    tvPasswordStrengthLabel.setTextColor(colorGreen);
                    pbPasswordStrength.setProgressTintList(android.content.res.ColorStateList.valueOf(colorGreen));
                } else if (score >= 3) {
                    tvPasswordStrengthLabel.setText("Strength: Medium");
                    tvPasswordStrengthLabel.setTextColor(colorAmber);
                    pbPasswordStrength.setProgressTintList(android.content.res.ColorStateList.valueOf(colorAmber));
                } else {
                    tvPasswordStrengthLabel.setText("Strength: Weak");
                    tvPasswordStrengthLabel.setTextColor(colorDanger);
                    pbPasswordStrength.setProgressTintList(android.content.res.ColorStateList.valueOf(colorDanger));
                }
            }
        });
    }

    private void updateRuleView(TextView tv, boolean met, String text) {
        // Update indicator icon and text colour for a password strength criteria rule
        if (met) {
            tv.setText("✓ " + text);
            tv.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
        } else {
            tv.setText("○ " + text);
            tv.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
        }
    }

    // ── Wire button listeners ─────────────────────────────────────────────────
    private void wireButtons() {
        // [IT22106292] - Wires button click listeners for registration flow
        // Attach click listeners for the Register, Pick Location, and Back navigation buttons
        btnPickLocation.setOnClickListener(v -> showMapPickerDialog());
        btnRegister.setOnClickListener(v -> performRegistration());
        View btnBack = findViewById(R.id.btn_register_back);
        if (btnBack != null) btnBack.setOnClickListener(v -> finish());
        View tvLogin = findViewById(R.id.tv_login_link);
        if (tvLogin != null) tvLogin.setOnClickListener(v -> finish());
    }

    // ── Full-screen OSMDroid map picker dialog with address search ───────────
    private void showMapPickerDialog() {
        // Open full-screen OSMDroid map dialog with live place search to pin GPS installation coordinates
        Dialog dialog = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_map_picker);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        MapView dialogMap = dialog.findViewById(R.id.map_dialog_view);
        Button btnApplyLocation = dialog.findViewById(R.id.btn_apply_location);
        Button btnCancelMap = dialog.findViewById(R.id.btn_cancel_map);
        TextView tvCoordPreview = dialog.findViewById(R.id.tv_coord_preview);

        // Search bar views
        EditText etMapSearch = dialog.findViewById(R.id.et_map_search);
        Button btnMapSearch = dialog.findViewById(R.id.btn_map_search);
        LinearLayout layoutSearchStatus = dialog.findViewById(R.id.layout_search_status);
        View progressMapSearch = dialog.findViewById(R.id.progress_map_search);
        TextView tvSearchStatus = dialog.findViewById(R.id.tv_search_status);

        // Pre-fill search field if user already entered an address in form
        String formAddress = etAddress.getText().toString().trim();
        if (!formAddress.isEmpty()) {
            etMapSearch.setText(formAddress);
        }

        // Configure full dialog map
        Configuration.getInstance().load(this, getPreferences(MODE_PRIVATE));
        dialogMap.setTileSource(TileSourceFactory.MAPNIK);
        dialogMap.setBuiltInZoomControls(true);
        dialogMap.setMultiTouchControls(true);

        // Start at already-selected position or Sri Lanka centre
        double startLat = selectedLat != null ? selectedLat : DEFAULT_LAT;
        double startLng = selectedLng != null ? selectedLng : DEFAULT_LNG;
        dialogMap.getController().setZoom(selectedLat != null ? 14.0 : 8.0);
        dialogMap.getController().setCenter(new GeoPoint(startLat, startLng));

        // Draggable marker
        final Marker[] dialogMarker = {new Marker(dialogMap)};
        dialogMarker[0].setPosition(new GeoPoint(startLat, startLng));
        dialogMarker[0].setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
        dialogMarker[0].setTitle("Solar Installation Site");
        dialogMarker[0].setDraggable(true);
        dialogMap.getOverlays().add(dialogMarker[0]);

        final double[] pickedLat = {startLat};
        final double[] pickedLng = {startLng};
        final String[] resolvedPlaceName = {null};

        // Update coord label when marker dragged
        dialogMarker[0].setOnMarkerDragListener(new Marker.OnMarkerDragListener() {
            @Override public void onMarkerDrag(Marker marker) {}
            @Override public void onMarkerDragEnd(Marker marker) {
                pickedLat[0] = marker.getPosition().getLatitude();
                pickedLng[0] = marker.getPosition().getLongitude();
                tvCoordPreview.setText(String.format("Lat: %.5f  Lng: %.5f", pickedLat[0], pickedLng[0]));
            }
            @Override public void onMarkerDragStart(Marker marker) {}
        });

        // Tap map to move marker
        dialogMap.getOverlays().add(new org.osmdroid.views.overlay.Overlay() {
            @Override
            public boolean onSingleTapConfirmed(android.view.MotionEvent e, MapView mapView) {
                org.osmdroid.api.IGeoPoint tapped = mapView.getProjection().fromPixels((int) e.getX(), (int) e.getY());
                pickedLat[0] = tapped.getLatitude();
                pickedLng[0] = tapped.getLongitude();
                dialogMarker[0].setPosition(new GeoPoint(pickedLat[0], pickedLng[0]));
                tvCoordPreview.setText(String.format("Lat: %.5f  Lng: %.5f", pickedLat[0], pickedLng[0]));
                mapView.invalidate();
                return true;
            }
        });

        tvCoordPreview.setText(String.format("📍 Lat: %.5f  Lng: %.5f", startLat, startLng));

        // ── Search address logic (Nominatim + Geocoder fallback) ─────────────
        Runnable doSearch = () -> {
            String query = etMapSearch.getText().toString().trim();
            if (query.isEmpty()) {
                Toast.makeText(RegisterActivity.this, "Please enter an address or place to search", Toast.LENGTH_SHORT).show();
                return;
            }

            // Dismiss soft keyboard
            InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (imm != null && etMapSearch.getWindowToken() != null) {
                imm.hideSoftInputFromWindow(etMapSearch.getWindowToken(), 0);
            }

            layoutSearchStatus.setVisibility(View.VISIBLE);
            progressMapSearch.setVisibility(View.VISIBLE);
            tvSearchStatus.setText("Searching location for \"" + query + "\"...");
            btnMapSearch.setEnabled(false);

            new Thread(() -> {
                double foundLat = Double.NaN;
                double foundLng = Double.NaN;
                String foundAddress = null;

                // 1. Query OpenStreetMap Nominatim Geocoding API
                try {
                    String encoded = URLEncoder.encode(query, "UTF-8");
                    String url = "https://nominatim.openstreetmap.org/search?q=" + encoded + "&format=json&limit=1&addressdetails=1";
                    Request req = new Request.Builder()
                            .url(url)
                            .header("User-Agent", "SmartSolarMobile/1.0 (Android; OpenStreetMap)")
                            .header("Accept-Language", "en")
                            .get()
                            .build();

                    Response resp = ApiClient.getClient().newCall(req).execute();
                    if (resp.isSuccessful() && resp.body() != null) {
                        String bodyStr = resp.body().string();
                        JSONArray arr = new JSONArray(bodyStr);
                        if (arr.length() > 0) {
                            JSONObject first = arr.getJSONObject(0);
                            foundLat = first.getDouble("lat");
                            foundLng = first.getDouble("lon");
                            foundAddress = first.optString("display_name", query);
                        }
                    }
                } catch (Exception ignored) {}

                // 2. Fallback to Android built-in Geocoder
                if (Double.isNaN(foundLat) && Geocoder.isPresent()) {
                    try {
                        Geocoder geocoder = new Geocoder(RegisterActivity.this, Locale.getDefault());
                        List<Address> addresses = geocoder.getFromLocationName(query, 1);
                        if (addresses != null && !addresses.isEmpty()) {
                            Address addr = addresses.get(0);
                            foundLat = addr.getLatitude();
                            foundLng = addr.getLongitude();
                            foundAddress = addr.getAddressLine(0);
                        }
                    } catch (Exception ignored) {}
                }

                final double resLat = foundLat;
                final double resLng = foundLng;
                final String resAddr = foundAddress;

                runOnUiThread(() -> {
                    btnMapSearch.setEnabled(true);
                    if (!Double.isNaN(resLat) && !Double.isNaN(resLng)) {
                        pickedLat[0] = resLat;
                        pickedLng[0] = resLng;
                        resolvedPlaceName[0] = resAddr;

                        // Center map and reposition marker
                        GeoPoint point = new GeoPoint(resLat, resLng);
                        dialogMarker[0].setPosition(point);
                        dialogMap.getController().setZoom(15.0);
                        dialogMap.getController().animateTo(point);

                        String shortDisplay = resAddr != null ? resAddr.split(",")[0] : query;
                        tvCoordPreview.setText(String.format("%s\nLat: %.5f  Lng: %.5f", shortDisplay, resLat, resLng));

                        layoutSearchStatus.setVisibility(View.VISIBLE);
                        progressMapSearch.setVisibility(View.GONE);
                        tvSearchStatus.setText("Found: " + (resAddr != null ? resAddr : query));

                        // Pre-fill the form address field if empty or default
                        if (etAddress.getText().toString().trim().isEmpty() && resAddr != null) {
                            etAddress.setText(resAddr);
                        }
                    } else {
                        layoutSearchStatus.setVisibility(View.VISIBLE);
                        progressMapSearch.setVisibility(View.GONE);
                        tvSearchStatus.setText("No location found for \"" + query + "\". Tap map directly.");
                        Toast.makeText(RegisterActivity.this, "Location not found. You can tap directly on the map to pin.", Toast.LENGTH_SHORT).show();
                    }
                });
            }).start();
        };

        btnMapSearch.setOnClickListener(v -> doSearch.run());

        // Keyboard search action (Enter / ActionSearch)
        etMapSearch.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH || actionId == EditorInfo.IME_ACTION_DONE) {
                doSearch.run();
                return true;
            }
            return false;
        });

        btnApplyLocation.setOnClickListener(v -> {
            selectedLat = pickedLat[0];
            selectedLng = pickedLng[0];
            // Update mini preview map
            updatePreviewMap(selectedLat, selectedLng);
            // Update status label
            tvSelectedLocation.setText(String.format(
                "Selected: Lat %.5f, Lng %.5f\nThis will be used to find nearby microgrid nodes.",
                selectedLat, selectedLng));
            tvSelectedLocation.setTextColor(getResources().getColor(R.color.neuro_green));

            // If an address was searched or resolved, update etAddress if user hasn't typed their own
            if (resolvedPlaceName[0] != null && etAddress.getText().toString().trim().isEmpty()) {
                etAddress.setText(resolvedPlaceName[0]);
            }

            dialog.dismiss();
        });

        btnCancelMap.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    // ── Sync the mini preview map to the just-picked location ─────────────────
    private void updatePreviewMap(double lat, double lng) {
        // Recenter the mini layout map preview and position marker on the selected GPS coordinate
        if (mapPreview == null) return;
        mapPreview.getController().setZoom(14.0);
        mapPreview.getController().setCenter(new GeoPoint(lat, lng));
        if (previewMarker != null) {
            mapPreview.getOverlays().remove(previewMarker);
        }
        previewMarker = new Marker(mapPreview);
        previewMarker.setPosition(new GeoPoint(lat, lng));
        previewMarker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
        previewMarker.setTitle("Solar Installation Site");
        mapPreview.getOverlays().add(previewMarker);
        mapPreview.invalidate();
    }

    // ── Validate form and POST to /api/auth/register ──────────────────────────
    private void performRegistration() {
        // [IT22106292] - Handles new prosumer account creation and server registration
        // Validate form inputs, enforce strong password rule, POST registration payload to API
        String nic     = etNic.getText().toString().trim();
        String name    = etFullName.getText().toString().trim();
        String email   = etEmail.getText().toString().trim();
        String pass    = etPassword.getText().toString().trim();
        String phone   = etPhone.getText().toString().trim();
        String address = etAddress.getText().toString().trim();

        if (nic.isEmpty() || name.isEmpty() || email.isEmpty() || pass.isEmpty() || phone.isEmpty()) {
            showError("NIC, Full Name, Email, Password and Phone are required.");
            return;
        }
        if (!PasswordValidator.isStrong(pass)) {
            showError("Password is too weak. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special symbols.");
            return;
        }

        tvError.setVisibility(View.GONE);
        tvSuccess.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);
        btnRegister.setEnabled(false);

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("nic", nic);
                body.put("fullName", name);
                body.put("email", email);
                body.put("password", pass);
                body.put("phoneNumber", phone);
                body.put("address", address);

                // Include GPS if selected from map picker
                if (selectedLat != null && selectedLng != null) {
                    body.put("installationLatitude", selectedLat);
                    body.put("installationLongitude", selectedLng);
                }

                Request request = new Request.Builder()
                        .url(ApiClient.BASE_URL + "auth/register")
                        .post(ApiClient.jsonBody(body))
                        .addHeader("Content-Type", "application/json")
                        .build();

                Response response = ApiClient.getClient().newCall(request).execute();
                String responseBody = response.body().string();
                JSONObject json = new JSONObject(responseBody);

                if (response.isSuccessful()) {
                    String message = json.optString("message", "Registration successful!");
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        tvSuccess.setText(message + "\n\nPlease wait for a Backoffice officer to activate your account before logging in.");
                        tvSuccess.setVisibility(View.VISIBLE);
                        btnRegister.setEnabled(true);
                    });
                } else {
                    String msg = json.optString("message", "Registration failed.");
                    runOnUiThread(() -> { showError(msg); btnRegister.setEnabled(true); });
                }
            } catch (Exception e) {
                runOnUiThread(() -> { showError("Network error: " + e.getMessage()); btnRegister.setEnabled(true); });
            }
        }).start();
    }

    private void showError(String msg) {
        // Hide progress bar, format error text, and display error container to user
        progressBar.setVisibility(View.GONE);
        tvError.setText(msg);
        tvError.setVisibility(View.VISIBLE);
    }

        @Override
    public void onResume() {
        // Resume OSMDroid map preview tile rendering
        super.onResume();
        if (mapPreview != null) mapPreview.onResume();
    }

    @Override
    public void onPause() {
        // Pause OSMDroid map preview tile rendering
        super.onPause();
        if (mapPreview != null) mapPreview.onPause();
    }
}
