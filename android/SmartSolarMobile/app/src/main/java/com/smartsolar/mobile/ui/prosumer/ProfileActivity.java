// ============================================================================
// File: ProfileActivity.java
// Author: IT22207418
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer profile management, solar installation GPS update, and deactivation requests.
// Architecture: FAT Service Pattern (All business logic centralized in API)
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.app.Dialog;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.location.Address;
import android.location.Geocoder;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.DatabaseHelper;
import com.smartsolar.mobile.data.SessionManager;
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

public class ProfileActivity extends AppCompatActivity {

    private EditText etFullName, etPhone, etAddress, etDeactivationReason;
    private TextView tvAvatarInitials, tvHeaderName, tvStatusBadge, tvRoleBadge, tvNicLabel, tvEmailDisplay;
    private TextView tvError, tvSuccess;
    private Button btnSaveProfile, btnPickProfileLocation, btnRequestDeactivation;
    private View progressBar;
    private SessionManager sessionManager;

    // Email Management Views
    private TextView tvEmailCardDisplay, tvEmailRateLimitInfo, tvEmailStatusBadge, tvEmailPendingMsg;
    private LinearLayout layoutEmailRateLimitBanner, layoutEmailPendingBanner, layoutEmailAccessGranted;
    private EditText etNewEmail;
    private Button btnConfirmEmailUpdate, btnRequestEmailUpdate;

    // Email Management State
    private boolean emailAccessGranted = false;
    private String emailRequestStatus = "None";
    private int emailUpdates24h = 0;
    private int emailUpdatesRemaining = 3;

    // Track changes
    private String initialName = "", initialPhone = "", initialAddress = "";
    private Double initialInstallationLatitude;
    private Double initialInstallationLongitude;
    private Double installationLatitude;
    private Double installationLongitude;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind all profile, email management and deactivation views, then load profile
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        tvAvatarInitials = findViewById(R.id.tv_avatar_initials);
        tvHeaderName     = findViewById(R.id.tv_header_name);
        tvStatusBadge    = findViewById(R.id.tv_status_badge);
        tvRoleBadge      = findViewById(R.id.tv_role_badge);
        tvNicLabel       = findViewById(R.id.tv_nic_label);
        tvEmailDisplay   = findViewById(R.id.tv_email_display);

        // Email Management Views
        tvEmailCardDisplay         = findViewById(R.id.tv_email_card_display);
        tvEmailRateLimitInfo       = findViewById(R.id.tv_email_rate_limit_info);
        tvEmailStatusBadge         = findViewById(R.id.tv_email_status_badge);
        tvEmailPendingMsg          = findViewById(R.id.tv_email_pending_msg);
        layoutEmailRateLimitBanner = findViewById(R.id.layout_email_rate_limit_banner);
        layoutEmailPendingBanner   = findViewById(R.id.layout_email_pending_banner);
        layoutEmailAccessGranted   = findViewById(R.id.layout_email_access_granted);
        etNewEmail                 = findViewById(R.id.et_new_email);
        btnConfirmEmailUpdate      = findViewById(R.id.btn_confirm_email_update);
        btnRequestEmailUpdate      = findViewById(R.id.btn_request_email_update);

        etFullName = findViewById(R.id.et_full_name);
        etPhone    = findViewById(R.id.et_phone);
        etAddress  = findViewById(R.id.et_address);
        etDeactivationReason = findViewById(R.id.et_deactivation_reason);

        tvError    = findViewById(R.id.tv_error);
        tvSuccess  = findViewById(R.id.tv_success);
        btnSaveProfile = findViewById(R.id.btn_save_profile);
        btnPickProfileLocation = findViewById(R.id.btn_pick_profile_location);
        btnRequestDeactivation = findViewById(R.id.btn_request_deactivation);
        progressBar = findViewById(R.id.progress_bar);

        loadProfile();

        btnSaveProfile.setOnClickListener(v -> saveProfile());
        btnPickProfileLocation.setOnClickListener(v -> showProfileMapPicker());
        btnRequestDeactivation.setOnClickListener(v -> requestDeactivation());
        btnRequestEmailUpdate.setOnClickListener(v -> showRequestEmailUpdateDialog());
        btnConfirmEmailUpdate.setOnClickListener(v -> confirmEmailUpdate());

        applyEntranceMotion();
    }

    // ── Structured entrance motion: identity header fades, cards rise in sequence ─────
    private void applyEntranceMotion() {
        try {
            android.view.animation.Animation fade =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.fade_in);
            android.view.animation.Animation rise =
                    android.view.animation.AnimationUtils.loadAnimation(this, R.anim.slide_up);
            View cover = findViewById(R.id.profile_cover);
            View card = findViewById(R.id.profile_card);
            if (cover != null) cover.startAnimation(fade);
            if (card != null) {
                card.startAnimation(rise);
            }
        } catch (Exception ignored) {}
    }

    private void loadProfile() {
        // [IT22207418] - Fetches and populates user profile data from the API
        // GET /api/users/{nic} to fetch prosumer profile, email update permissions, and cache data in SQLite
        progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "users/" + nic).get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                JSONObject json = new JSONObject(response.body().string());
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    String fullName = json.optString("fullName");
                    tvHeaderName.setText(fullName);
                    etFullName.setText(fullName);

                    // Avatar initials
                    if (!fullName.isEmpty()) {
                        String[] parts = fullName.split(" ");
                        String initials = "";
                        if (parts.length > 0) initials += parts[0].charAt(0);
                        if (parts.length > 1) initials += parts[parts.length - 1].charAt(0);
                        tvAvatarInitials.setText(initials.toUpperCase());
                    }

                    tvStatusBadge.setText(json.optString("status"));
                    tvRoleBadge.setText(json.optString("role"));
                    tvNicLabel.setText("NIC: " + json.optString("nic"));
                    
                    String email = json.optString("email");
                    tvEmailDisplay.setText(email);
                    if (tvEmailCardDisplay != null) {
                        tvEmailCardDisplay.setText(email);
                    }

                    // Email Update Access & Rate Limiting fields
                    emailAccessGranted = json.optBoolean("emailUpdateAccessGranted", false);
                    emailRequestStatus = json.optString("emailUpdateRequestStatus", "None");
                    emailUpdates24h = json.optInt("emailUpdatesLast24Hours", 0);
                    emailUpdatesRemaining = json.optInt("emailUpdatesRemaining24Hours", 3);

                    updateEmailUiState();

                    String phone = json.optString("phoneNumber");
                    String address = json.optString("address");

                        new DatabaseHelper(ProfileActivity.this).cacheUser(
                            json.optString("nic"), fullName, email, json.optString("role"),
                            json.optString("phoneNumber"), address, json.optString("status"),
                            json.optString("createdAt"));

                        installationLatitude = json.has("installationLatitude") && !json.isNull("installationLatitude")
                            ? json.optDouble("installationLatitude") : null;
                        installationLongitude = json.has("installationLongitude") && !json.isNull("installationLongitude")
                            ? json.optDouble("installationLongitude") : null;

                    etPhone.setText(phone);
                    etAddress.setText(address);

                    // Store initial values for change detection
                    initialName = fullName;
                    initialPhone = phone;
                    initialAddress = address;
                    initialInstallationLatitude = installationLatitude;
                    initialInstallationLongitude = installationLongitude;
                });
            } catch (Exception e) {
                runOnUiThread(() -> progressBar.setVisibility(View.GONE));
            }
        }).start();
    }

    private void updateEmailUiState() {
        // Update email banner, status badge, and action button visibility based on 24-hour rate limit status
        if (tvEmailRateLimitInfo == null) return;

        tvEmailRateLimitInfo.setText("Updates in last 24h: " + emailUpdates24h + " / 3 (Remaining: " + emailUpdatesRemaining + ")");

        // Rate limit: 3 times only within 24 hours
        boolean isLimitReached = emailUpdates24h >= 3;

        if (isLimitReached) {
            layoutEmailRateLimitBanner.setVisibility(View.VISIBLE);
            tvEmailStatusBadge.setText("Limit Reached");
            tvEmailStatusBadge.setTextColor(getResources().getColor(R.color.neuro_danger));
            layoutEmailPendingBanner.setVisibility(View.GONE);
            layoutEmailAccessGranted.setVisibility(View.GONE);
            btnRequestEmailUpdate.setVisibility(View.GONE);
            return;
        } else {
            layoutEmailRateLimitBanner.setVisibility(View.GONE);
        }

        if (emailAccessGranted) {
            // Access granted by Backoffice
            tvEmailStatusBadge.setText("Access Granted");
            tvEmailStatusBadge.setTextColor(getResources().getColor(R.color.neuro_green_dark));
            layoutEmailAccessGranted.setVisibility(View.VISIBLE);
            layoutEmailPendingBanner.setVisibility(View.GONE);
            btnRequestEmailUpdate.setVisibility(View.GONE);
        } else if ("Pending".equalsIgnoreCase(emailRequestStatus)) {
            // Awaiting Backoffice approval
            tvEmailStatusBadge.setText("Pending Approval");
            tvEmailStatusBadge.setTextColor(getResources().getColor(R.color.neuro_amber));
            layoutEmailAccessGranted.setVisibility(View.GONE);
            layoutEmailPendingBanner.setVisibility(View.VISIBLE);
            btnRequestEmailUpdate.setVisibility(View.GONE);
        } else if ("Denied".equalsIgnoreCase(emailRequestStatus)) {
            tvEmailStatusBadge.setText("Request Denied");
            tvEmailStatusBadge.setTextColor(getResources().getColor(R.color.neuro_danger));
            layoutEmailAccessGranted.setVisibility(View.GONE);
            layoutEmailPendingBanner.setVisibility(View.GONE);
            btnRequestEmailUpdate.setVisibility(View.VISIBLE);
            btnRequestEmailUpdate.setText("Re-request email update");
        } else {
            tvEmailStatusBadge.setText("Locked");
            tvEmailStatusBadge.setTextColor(getResources().getColor(R.color.neuro_text_secondary));
            layoutEmailAccessGranted.setVisibility(View.GONE);
            layoutEmailPendingBanner.setVisibility(View.GONE);
            btnRequestEmailUpdate.setVisibility(View.VISIBLE);
            btnRequestEmailUpdate.setText("Request email update access");
        }
    }

    private void showRequestEmailUpdateDialog() {
        // Display modal dialog allowing prosumer to submit new email and rationale for Backoffice review
        if (emailUpdates24h >= 3) {
            showStatusDialog("Limit Reached", "Email can only be updated 3 times within 24 hours. Please try later.", false);
            return;
        }

        final Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_request_email);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        EditText etRequestedEmail = dialog.findViewById(R.id.et_dialog_requested_email);
        EditText etReason = dialog.findViewById(R.id.et_dialog_reason);
        Button btnSubmit = dialog.findViewById(R.id.btn_dialog_submit_request);
        Button btnCancel = dialog.findViewById(R.id.btn_dialog_cancel);

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnSubmit.setOnClickListener(v -> {
            String requestedEmail = etRequestedEmail.getText().toString().trim();
            String reason = etReason.getText().toString().trim();

            if (!requestedEmail.isEmpty() && !android.util.Patterns.EMAIL_ADDRESS.matcher(requestedEmail).matches()) {
                Toast.makeText(this, "Please enter a valid email address.", Toast.LENGTH_SHORT).show();
                return;
            }

            dialog.dismiss();
            submitEmailUpdateRequest(requestedEmail, reason);
        });

        dialog.show();
    }

    private void submitEmailUpdateRequest(String requestedEmail, String reason) {
        // POST /api/users/{nic}/request-email-update with requested email and reason
        progressBar.setVisibility(View.VISIBLE);
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                if (!requestedEmail.isEmpty()) {
                    body.put("requestedNewEmail", requestedEmail);
                }
                if (!reason.isEmpty()) {
                    body.put("reason", reason);
                }

                Request request = ApiClient.buildAuthRequest(this, "users/" + nic + "/request-email-update")
                        .post(ApiClient.jsonBody(body)).build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String bodyStr = response.body().string();
                JSONObject json = new JSONObject(bodyStr);
                String msg = json.optString("message", "Request submitted.");

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    if (response.isSuccessful()) {
                        showStatusDialog("Request Submitted", msg, true);
                        loadProfile();
                    } else {
                        showStatusDialog("Request Rejected", msg, false);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    showStatusDialog("Network Error", "Unable to submit request. Please try again.", false);
                });
            }
        }).start();
    }

    private void confirmEmailUpdate() {
        // PUT /api/users/{nic}/update-email to commit new email address after Backoffice permission grant
        if (emailUpdates24h >= 3) {
            showStatusDialog("Limit Reached", "Email can only be updated 3 times within 24 hours. Please try later.", false);
            return;
        }

        String newEmail = etNewEmail.getText().toString().trim();
        if (newEmail.isEmpty()) {
            showStatusDialog("Email Required", "Please enter the new email address.", false);
            return;
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(newEmail).matches()) {
            showStatusDialog("Invalid Email", "Please enter a valid email address.", false);
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnConfirmEmailUpdate.setEnabled(false);
        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("newEmail", newEmail);

                Request request = ApiClient.buildAuthRequest(this, "users/" + nic + "/update-email")
                        .put(ApiClient.jsonBody(body)).build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String bodyStr = response.body().string();
                JSONObject json = new JSONObject(bodyStr);
                String msg = json.optString("message", "Email updated.");

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnConfirmEmailUpdate.setEnabled(true);
                    if (response.isSuccessful()) {
                        etNewEmail.setText("");
                        showStatusDialog("Success!", msg, true);
                        loadProfile();
                    } else {
                        // Will display "try later" if 24h limit reached
                        showStatusDialog("Update Failed", msg, false);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnConfirmEmailUpdate.setEnabled(true);
                    showStatusDialog("Network Error", "Unable to update email. Please try again.", false);
                });
            }
        }).start();
    }

    private void saveProfile() {
        // [IT22207418] - Submits updated profile data to the backend API
        // Validate inputs, detect changes, and PUT /api/users/{nic}/profile with updated profile payload
        String name    = etFullName.getText().toString().trim();
        String phone   = etPhone.getText().toString().trim();
        String address = etAddress.getText().toString().trim();

        if (name.isEmpty() || phone.isEmpty()) {
            showStatusDialog("Required Fields", "Name and phone number are required.", false);
            return;
        }

        // Detect if anything actually changed
        boolean locationChanged = !java.util.Objects.equals(installationLatitude, initialInstallationLatitude)
            || !java.util.Objects.equals(installationLongitude, initialInstallationLongitude);
        if (name.equals(initialName) && phone.equals(initialPhone) && address.equals(initialAddress) && !locationChanged) {
            showStatusDialog("No Changes", "You haven't made any modifications to your profile.", false);
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        btnSaveProfile.setEnabled(false);
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("fullName", name);
                body.put("phoneNumber", phone);
                body.put("address", address);
                if (installationLatitude != null && installationLongitude != null) {
                    body.put("installationLatitude", installationLatitude);
                    body.put("installationLongitude", installationLongitude);
                }
                Request request = ApiClient.buildAuthRequest(this, "users/" + nic + "/profile")
                        .put(ApiClient.jsonBody(body)).build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String bodyStr = response.body().string();
                JSONObject json = new JSONObject(bodyStr);
                String msg = json.optString("message", "Profile updated.");

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnSaveProfile.setEnabled(true);
                    if (response.isSuccessful()) {
                        tvHeaderName.setText(name);
                        
                        // Update initial values so next click detects "no changes"
                        initialName = name;
                        initialPhone = phone;
                        initialAddress = address;
                        initialInstallationLatitude = installationLatitude;
                        initialInstallationLongitude = installationLongitude;

                        showStatusDialog("Success!", "Your profile has been updated successfully.", true);
                    } else {
                        showStatusDialog("Update Failed", msg, false);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnSaveProfile.setEnabled(true);
                    showStatusDialog("Network Error", "Unable to connect to the server. Please try again.", false);
                });
            }
        }).start();
    }

    /** Opens the reusable map picker with address search for the solar installation. */
    private void showProfileMapPicker() {
        // Launch OSMDroid map picker dialog allowing prosumer to update solar installation GPS coordinates
        Dialog dialog = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_map_picker);
        if (dialog.getWindow() != null) dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));

        MapView map = dialog.findViewById(R.id.map_dialog_view);
        Button apply = dialog.findViewById(R.id.btn_apply_location);
        Button cancel = dialog.findViewById(R.id.btn_cancel_map);
        TextView coordinates = dialog.findViewById(R.id.tv_coord_preview);
        EditText search = dialog.findViewById(R.id.et_map_search);
        Button searchButton = dialog.findViewById(R.id.btn_map_search);
        LinearLayout searchStatus = dialog.findViewById(R.id.layout_search_status);
        View searchProgress = dialog.findViewById(R.id.progress_map_search);
        TextView searchMessage = dialog.findViewById(R.id.tv_search_status);

        String address = etAddress.getText().toString().trim();
        if (!address.isEmpty()) search.setText(address);
        Configuration.getInstance().load(this, getPreferences(MODE_PRIVATE));
        map.setTileSource(TileSourceFactory.MAPNIK);
        map.setBuiltInZoomControls(true);
        map.setMultiTouchControls(true);

        final double[] pickedLat = {installationLatitude != null ? installationLatitude : 7.8731};
        final double[] pickedLng = {installationLongitude != null ? installationLongitude : 80.7718};
        map.getController().setZoom(installationLatitude != null ? 14.0 : 8.0);
        map.getController().setCenter(new GeoPoint(pickedLat[0], pickedLng[0]));

        final Marker marker = new Marker(map);
        marker.setPosition(new GeoPoint(pickedLat[0], pickedLng[0]));
        marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM);
        marker.setTitle("Solar Installation Site");
        marker.setDraggable(true);
        map.getOverlays().add(marker);
        coordinates.setText(String.format(Locale.US, "Lat: %.5f  Lng: %.5f", pickedLat[0], pickedLng[0]));

        marker.setOnMarkerDragListener(new Marker.OnMarkerDragListener() {
            @Override public void onMarkerDrag(Marker ignored) {}
            @Override public void onMarkerDragStart(Marker ignored) {}
            @Override public void onMarkerDragEnd(Marker moved) {
                pickedLat[0] = moved.getPosition().getLatitude();
                pickedLng[0] = moved.getPosition().getLongitude();
                coordinates.setText(String.format(Locale.US, "Lat: %.5f  Lng: %.5f", pickedLat[0], pickedLng[0]));
            }
        });

        map.getOverlays().add(new org.osmdroid.views.overlay.Overlay() {
            @Override public boolean onSingleTapConfirmed(android.view.MotionEvent event, MapView mapView) {
                org.osmdroid.api.IGeoPoint point = mapView.getProjection().fromPixels((int) event.getX(), (int) event.getY());
                pickedLat[0] = point.getLatitude();
                pickedLng[0] = point.getLongitude();
                marker.setPosition(new GeoPoint(pickedLat[0], pickedLng[0]));
                coordinates.setText(String.format(Locale.US, "Lat: %.5f  Lng: %.5f", pickedLat[0], pickedLng[0]));
                mapView.invalidate();
                return true;
            }
        });

        searchButton.setOnClickListener(v -> {
            String query = search.getText().toString().trim();
            if (query.isEmpty()) {
                Toast.makeText(this, "Enter an address or place to search.", Toast.LENGTH_SHORT).show();
                return;
            }
            InputMethodManager keyboard = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
            if (keyboard != null) keyboard.hideSoftInputFromWindow(search.getWindowToken(), 0);
            searchStatus.setVisibility(View.VISIBLE);
            searchProgress.setVisibility(View.VISIBLE);
            searchMessage.setText("Searching for \"" + query + "\"...");
            searchButton.setEnabled(false);

            new Thread(() -> {
                double foundLat = Double.NaN;
                double foundLng = Double.NaN;
                String foundAddress = null;
                try {
                    String encoded = URLEncoder.encode(query, "UTF-8");
                    Request request = new Request.Builder()
                            .url("https://nominatim.openstreetmap.org/search?q=" + encoded + "&format=json&limit=1&addressdetails=1")
                            .header("User-Agent", "SmartSolarMobile/1.0 (Android; OpenStreetMap)")
                            .header("Accept-Language", "en")
                            .get().build();
                    Response response = ApiClient.getClient().newCall(request).execute();
                    if (response.isSuccessful() && response.body() != null) {
                        JSONArray results = new JSONArray(response.body().string());
                        if (results.length() > 0) {
                            JSONObject first = results.getJSONObject(0);
                            foundLat = first.getDouble("lat");
                            foundLng = first.getDouble("lon");
                            foundAddress = first.optString("display_name", query);
                        }
                    }
                } catch (Exception ignored) {}

                if (Double.isNaN(foundLat) && Geocoder.isPresent()) {
                    try {
                        List<Address> results = new Geocoder(this, Locale.getDefault()).getFromLocationName(query, 1);
                        if (results != null && !results.isEmpty()) {
                            Address result = results.get(0);
                            foundLat = result.getLatitude();
                            foundLng = result.getLongitude();
                            foundAddress = result.getAddressLine(0);
                        }
                    } catch (Exception ignored) {}
                }

                final double resultLat = foundLat;
                final double resultLng = foundLng;
                final String resultAddress = foundAddress;
                runOnUiThread(() -> {
                    searchButton.setEnabled(true);
                    searchProgress.setVisibility(View.GONE);
                    if (!Double.isNaN(resultLat) && !Double.isNaN(resultLng)) {
                        pickedLat[0] = resultLat;
                        pickedLng[0] = resultLng;
                        GeoPoint point = new GeoPoint(resultLat, resultLng);
                        marker.setPosition(point);
                        map.getController().setZoom(15.0);
                        map.getController().animateTo(point);
                        coordinates.setText(String.format(Locale.US, "%s\nLat: %.5f  Lng: %.5f",
                                resultAddress != null ? resultAddress.split(",")[0] : query, resultLat, resultLng));
                        searchMessage.setText("Location found.");
                        if (resultAddress != null) search.setText(resultAddress);
                    } else {
                        searchMessage.setText("Location not found. Tap the map to choose a point.");
                    }
                });
            }).start();
        });

        cancel.setOnClickListener(v -> dialog.dismiss());
        apply.setOnClickListener(v -> {
            installationLatitude = pickedLat[0];
            installationLongitude = pickedLng[0];
            if (!search.getText().toString().trim().isEmpty()) etAddress.setText(search.getText().toString().trim());
            dialog.dismiss();
        });
        dialog.show();
    }

    private void showStatusDialog(String title, String message, boolean isSuccess) {
        // Display custom glassmorphic alert dialog with animated icon for success or error feedback
        final Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_success);
        
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        TextView tvTitle = dialog.findViewById(R.id.tv_dialog_title);
        TextView tvMsg = dialog.findViewById(R.id.tv_dialog_message);
        ImageView ivIcon = dialog.findViewById(R.id.iv_success_icon);
        Button btnOk = dialog.findViewById(R.id.btn_dialog_ok);

        tvTitle.setText(title);
        tvMsg.setText(message);

        if (!isSuccess) {
            ivIcon.setImageResource(R.drawable.ic_line_close);
            ivIcon.setImageTintList(ColorStateList.valueOf(getResources().getColor(R.color.neuro_danger)));
            btnOk.setBackgroundTintList(ColorStateList.valueOf(getResources().getColor(R.color.neuro_danger)));
            btnOk.setTextColor(getResources().getColor(R.color.white));
        }

        // Animated icon pop
        ScaleAnimation scale = new ScaleAnimation(0, 1, 0, 1, 
                Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
        scale.setDuration(400);
        ivIcon.startAnimation(scale);

        btnOk.setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void requestDeactivation() {
        // [IT22207418] - Triggers account deactivation flow with confirmation dialog
        // PUT /api/users/{nic}/request-deactivation with justification message for Backoffice review
        String reason = etDeactivationReason.getText().toString().trim();
        if (reason.isEmpty()) {
            showStatusDialog("Reason Required", "Please provide a reason for deactivation.", false);
            return;
        }
        progressBar.setVisibility(View.VISIBLE);
        btnRequestDeactivation.setEnabled(false);
        String nic = sessionManager.getNic();
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("reason", reason);
                Request request = ApiClient.buildAuthRequest(this, "users/" + nic + "/request-deactivation")
                        .put(ApiClient.jsonBody(body)).build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String bodyStr = response.body().string();
                JSONObject json = new JSONObject(bodyStr);
                String msg = json.optString("message", "Request submitted.");
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnRequestDeactivation.setEnabled(true);
                    if (response.isSuccessful()) {
                        showStatusDialog("Request Submitted", "A Backoffice officer will review your deactivation request shortly.", true);
                        etDeactivationReason.setText("");
                    } else {
                        showStatusDialog("Submission Failed", msg, false);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnRequestDeactivation.setEnabled(true);
                    showStatusDialog("Network Error", "Unable to submit your request. Please try again.", false);
                });
            }
        }).start();
    }
}
