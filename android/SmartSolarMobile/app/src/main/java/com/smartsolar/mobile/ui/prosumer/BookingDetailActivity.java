// ============================================================================
// File: BookingDetailActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Reservation detail, update, and cancel screen (Summary Page).
//              Shows QR code for Approved bookings.
//              Update/Cancel enforces the 12-hour notice rule (API enforces strictly).
// Architecture: FAT Service Pattern - 12-hour rule enforced by C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import com.google.zxing.BarcodeFormat;
import com.journeyapps.barcodescanner.BarcodeEncoder;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/** Booking detail, summary, update and cancellation screen with QR dispatch. */
public class BookingDetailActivity extends AppCompatActivity {

    private TextView tvCode, tvStation, tvScheduled, tvEnergy, tvCost, tvType, tvSlot, tvQrHint, tvError, tvSummaryHeader;
    private LinearLayout layoutStatusTimeline;
    private ImageView ivQrCode;
    private Button btnEdit, btnCancel, btnBack;
    private View progressBar;
    private SessionManager sessionManager;
    private String reservationId, prosumerNic;
    private boolean showSummary;
    private JSONObject currentReservation;

    /** Loads reservation details from API and shows QR code if approved. */
    // Fetches reservation by ID and renders summary page with QR payload
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Extract reservation ID, bind views, show summary header if confirmed, and load reservation details
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_detail);

        sessionManager = new SessionManager(this);
        reservationId  = getIntent().getStringExtra("reservation_id");
        prosumerNic    = sessionManager.getNic();
        showSummary = getIntent().getBooleanExtra("show_summary", false);

        tvCode         = findViewById(R.id.tv_code);
        tvStation      = findViewById(R.id.tv_station);
        tvScheduled    = findViewById(R.id.tv_scheduled);
        tvEnergy       = findViewById(R.id.tv_energy);
        tvCost         = findViewById(R.id.tv_cost);
        tvType         = findViewById(R.id.tv_type);
        tvSlot         = findViewById(R.id.tv_slot);
        tvQrHint       = findViewById(R.id.tv_qr_hint);
        tvError        = findViewById(R.id.tv_error);
        tvSummaryHeader = findViewById(R.id.tv_summary_header);
        layoutStatusTimeline = findViewById(R.id.layout_status_timeline);
        ivQrCode       = findViewById(R.id.iv_qr_code);
        btnEdit        = findViewById(R.id.btn_edit);
        btnCancel      = findViewById(R.id.btn_cancel);
        btnBack        = findViewById(R.id.btn_back);
        progressBar    = findViewById(R.id.progress_bar);

        if (showSummary) {
            tvSummaryHeader.setText("Booking Placed!");
            tvSummaryHeader.setVisibility(View.VISIBLE);
        }

        loadReservationDetail();

        // Cancel booking - API enforces 12-hour notice rule
        btnEdit.setOnClickListener(v -> showEditReservationDialog());
        btnCancel.setOnClickListener(v -> cancelReservation());
        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        btnBack.setOnClickListener(v -> finish());
    }

    /** Fetches reservation detail from the C# Web API by ID. */
    // Calls GET /api/reservations/{id} and populates the summary page
    private void loadReservationDetail() {
        // GET /api/reservations/{id} and render booking status, converted local timestamp, and QR code
        progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this,
                        "reservations/" + reservationId).get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String body = response.body().string();
                JSONObject json = new JSONObject(body);
                currentReservation = json;

                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvCode.setText("Ref: " + json.optString("reservationCode"));
                    tvStation.setText("Hub: " + json.optString("stationName"));
                    // Fix: Parse UTC ISO datetime from API and convert to device local timezone for display
                    String rawScheduled = json.optString("scheduledDateTime", "");
                    String displayScheduled = rawScheduled;
                    try {
                        java.text.SimpleDateFormat utcParser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                        utcParser.setTimeZone(TimeZone.getTimeZone("UTC"));
                        java.util.Date parsedDate = utcParser.parse(rawScheduled.length() > 19 ? rawScheduled.substring(0, 19) : rawScheduled);
                        java.text.SimpleDateFormat localFormatter = new java.text.SimpleDateFormat("EEE, dd MMM yyyy HH:mm", Locale.getDefault());
                        localFormatter.setTimeZone(TimeZone.getDefault()); // Device local timezone
                        displayScheduled = localFormatter.format(parsedDate);
                    } catch (Exception ignored) {
                        // Fallback: basic strip if parse fails
                        displayScheduled = rawScheduled.replace("T", " ").substring(0, Math.min(16, rawScheduled.length()));
                    }
                    tvScheduled.setText("Scheduled: " + displayScheduled);
                    tvEnergy.setText("Energy: " + json.optDouble("energyAmountKWh") + " kWh for " + json.optInt("durationHours") + " hr(s)");
                    tvSlot.setText("Battery Slot: #" + json.optInt("slotNumber", 0));
                    tvCost.setText("Estimated Value: Rs. " + String.format("%.2f", json.optDouble("totalCost")));
                    tvType.setText("Type: " + ("DropOff".equals(json.optString("reservationType")) ? "Drop-Off (Selling to Grid)" : "Charging (Buying from Grid)"));
                    renderStatusTimeline(json.optString("status"));

                    // Show QR Code only once Backoffice has approved (never while Pending)
                    String qrData = json.optString("qrCodeData", "");
                    String status = json.optString("status");
                    if (showSummary) {
                        tvSummaryHeader.setText("Approved".equals(status)
                                ? "Booking Confirmed!" : "Booking Placed!");
                        tvSummaryHeader.setVisibility(View.VISIBLE);
                    }
                    if ("Approved".equals(status) && !qrData.isEmpty()) {
                        generateQrCode(qrData);
                        tvQrHint.setText("Show this QR code to the Grid Operator at the solar hub.");
                        tvQrHint.setVisibility(View.VISIBLE);
                        ivQrCode.setVisibility(View.VISIBLE);
                    }

                    // Show cancel button only for active bookings
                    if ("Approved".equals(status) || "Pending".equals(status)) {
                        btnEdit.setVisibility(View.VISIBLE);
                        btnCancel.setVisibility(View.VISIBLE);
                    } else {
                        btnEdit.setVisibility(View.GONE);
                        btnCancel.setVisibility(View.GONE);
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvError.setText("Failed to load reservation: " + e.getMessage());
                    tvError.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }

    /** Vertical status tracker like the delivery reference: done ✓, current ring, upcoming hollow. */
    private void renderStatusTimeline(String status) {
        if (layoutStatusTimeline == null) return;
        layoutStatusTimeline.removeAllViews();

        boolean cancelled = "Cancelled".equalsIgnoreCase(status) || "Canceled".equalsIgnoreCase(status);
        boolean missed = "Missed".equalsIgnoreCase(status);
        int stage; // 0=Pending, 1=Approved, 2=Completed
        if ("Completed".equalsIgnoreCase(status)) stage = 2;
        else if ("Approved".equalsIgnoreCase(status)) stage = 1;
        else stage = 0;

        String[] titles = { "Booking placed", "Approved by hub", "Completed" };
        String[] subs = {
                "Your request was received.",
                "Show the QR pass at the solar hub.",
                "Energy transfer recorded." };

        for (int i = 0; i < 3; i++) {
            int state; // 0=done, 1=current, 2=upcoming
            if (cancelled || missed) {
                state = (i == 0) ? 0 : 2;
            } else if (i < stage) {
                state = 0;
            } else if (i == stage) {
                state = 1;
            } else {
                state = 2;
            }
            layoutStatusTimeline.addView(
                    buildTimelineRow(titles[i], subs[i], state, false, false));
        }

        // Terminal row: Missed (amber) or Cancelled (red).
        if (missed) {
            layoutStatusTimeline.addView(buildTimelineRow(
                    "Missed \u2014 No Show",
                    "You did not complete the transaction by the scheduled time. Your slot was released.",
                    1,
                    true,
                    true));
        } else {
            // Operator-released bookings carry an operator note stamped by the release API.
            String cancelledSub = "Not cancelled";
            if (cancelled) {
                String opNotes = currentReservation != null
                        ? currentReservation.optString("operatorNotes", "") : "";
                cancelledSub = opNotes.startsWith("Cancelled by Grid Operator")
                        ? opNotes : "This booking was cancelled.";
            }
            layoutStatusTimeline.addView(buildTimelineRow(
                    "Cancelled",
                    cancelledSub,
                    cancelled ? 1 : 2,
                    cancelled,
                    true));
        }
    }

    /**
     * One timeline row: dot + connector rail on the left, title + subtitle on the right.
     *
     * @param state 0 done, 1 current, 2 upcoming
     */
    private View buildTimelineRow(String title, String sub, int state, boolean red, boolean isLast) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setMinimumHeight(dpToPx(56));
        row.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        // Left rail: dot on top, connector filling the rest of the row
        LinearLayout rail = new LinearLayout(this);
        rail.setOrientation(LinearLayout.VERTICAL);
        rail.setGravity(android.view.Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams railParams = new LinearLayout.LayoutParams(
                dpToPx(24), LinearLayout.LayoutParams.MATCH_PARENT);
        railParams.rightMargin = dpToPx(10);
        rail.setLayoutParams(railParams);
        row.addView(rail);

        int dotSize = (state == 1) ? dpToPx(22) : dpToPx(20);
        if (state == 1 && !red) {
            // Current step: ring with solid center dot
            android.widget.FrameLayout ring = new android.widget.FrameLayout(this);
            LinearLayout.LayoutParams ringParams = new LinearLayout.LayoutParams(dotSize, dotSize);
            ringParams.topMargin = dpToPx(2);
            ring.setLayoutParams(ringParams);
            try { ring.setBackgroundResource(R.drawable.bg_tl_ring); } catch (Exception ignored) {}
            View center = new View(this);
            android.widget.FrameLayout.LayoutParams centerParams =
                    new android.widget.FrameLayout.LayoutParams(dpToPx(10), dpToPx(10));
            centerParams.gravity = android.view.Gravity.CENTER;
            center.setLayoutParams(centerParams);
            try { center.setBackgroundResource(R.drawable.bg_tl_solid); } catch (Exception ignored) {}
            ring.addView(center);
            rail.addView(ring);
        } else {
            android.widget.FrameLayout dot = new android.widget.FrameLayout(this);
            LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(dotSize, dotSize);
            dotParams.topMargin = dpToPx(2);
            dot.setLayoutParams(dotParams);
            try {
                dot.setBackgroundResource(
                        red ? R.drawable.bg_tl_red
                                : (state == 0 ? R.drawable.bg_tl_solid : R.drawable.bg_tl_hollow));
            } catch (Exception ignored) {}
            if (state == 0 || red) {
                TextView mark = new TextView(this);
                mark.setText(red ? "✕" : "✓");
                mark.setTextSize(11f);
                mark.setTypeface(null, android.graphics.Typeface.BOLD);
                mark.setTextColor(android.graphics.Color.WHITE);
                mark.setGravity(android.view.Gravity.CENTER);
                mark.setLayoutParams(new android.widget.FrameLayout.LayoutParams(
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT));
                dot.addView(mark);
            }
            rail.addView(dot);
        }

        if (!isLast) {
            View connector = new View(this);
            LinearLayout.LayoutParams connParams = new LinearLayout.LayoutParams(
                    dpToPx(2), 0, 1f);
            connParams.topMargin = dpToPx(3);
            connParams.bottomMargin = dpToPx(3);
            connector.setLayoutParams(connParams);
            try { connector.setBackgroundColor(getResources().getColor(R.color.chart_teal_100)); }
            catch (Exception ignored) { connector.setBackgroundColor(android.graphics.Color.parseColor("#BFD5D0")); }
            rail.addView(connector);
        }

        // Right texts
        LinearLayout texts = new LinearLayout(this);
        texts.setOrientation(LinearLayout.VERTICAL);
        texts.setLayoutParams(new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        row.addView(texts);

        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextSize(13f);
        tvTitle.setTypeface(null, android.graphics.Typeface.BOLD);
        try {
            tvTitle.setTextColor(getResources().getColor(
                    red ? R.color.neuro_danger
                            : (state == 2 ? R.color.chart_teal_200 : R.color.chart_teal_500)));
        } catch (Exception ignored) {}
        texts.addView(tvTitle);

        TextView tvSub = new TextView(this);
        tvSub.setText(sub);
        tvSub.setTextSize(11f);
        try {
            tvSub.setTextColor(getResources().getColor(
                    state == 2 ? R.color.chart_teal_200 : R.color.chart_teal_300));
        } catch (Exception ignored) {}
        texts.addView(tvSub);

        row.setAlpha(0f);
        row.animate().alpha(1f).setDuration(280).start();
        return row;
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    /** Generates a QR code Bitmap from the reservation's signed QR payload. */
    // Uses ZXing BarcodeEncoder to render secure token as QR image
    private void generateQrCode(String qrData) {
        // Generate a 400x400 QR code bitmap using ZXing BarcodeEncoder for approved reservation
        try {
            BarcodeEncoder encoder = new BarcodeEncoder();
            Bitmap bitmap = encoder.encodeBitmap(qrData, BarcodeFormat.QR_CODE, 400, 400);
            ivQrCode.setImageBitmap(bitmap);
        } catch (Exception e) {
            tvQrHint.setText("QR code could not be rendered.");
        }
    }

    /** Opens the booking editor sheet styled like the Pick Date & Time dialog. */
    private void showEditReservationDialog() {
        // Adjust-Slots-style sheet: Date steppers + analog clock + energy/duration/type fields
        if (currentReservation == null) return;

        Calendar scheduled = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        try {
            String value = currentReservation.optString("scheduledDateTime");
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            java.util.Date parsed = parser.parse(value.replace("Z", ""));
            if (parsed != null) scheduled.setTime(parsed);
        } catch (Exception ignored) {
            scheduled.add(Calendar.HOUR_OF_DAY, 24);
        }
        final Calendar tmp = (Calendar) scheduled.clone();

        View view = getLayoutInflater().inflate(R.layout.dialog_edit_reservation, null);
        TextView tvCode = view.findViewById(R.id.tv_edit_code);
        TextView tvValue = view.findViewById(R.id.tv_edit_value);
        TextView tvHint = view.findViewById(R.id.tv_edit_hint);
        TextView tvSegDate = view.findViewById(R.id.tv_edit_seg_date);
        TextView tvSegTime = view.findViewById(R.id.tv_edit_seg_time);
        View dayStepper = view.findViewById(R.id.layout_edit_day_stepper);
        View clockWrap = view.findViewById(R.id.layout_edit_clock_wrap);
        TimePicker clock = view.findViewById(R.id.time_picker_edit_clock);
        EditText energy = view.findViewById(R.id.et_edit_energy);
        EditText duration = view.findViewById(R.id.et_edit_duration);
        Spinner type = view.findViewById(R.id.spinner_edit_type);
        final boolean[] isDateMode = {true};
        final boolean[] syncingClock = {false};

        tvCode.setText("Edit " + currentReservation.optString("reservationCode", "Reservation"));
        energy.setText(String.valueOf(currentReservation.optDouble("energyAmountKWh", 0)));
        duration.setText(String.valueOf(currentReservation.optInt("durationHours", 1)));
        String[] types = {"DropOff", "Charging"};
        type.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, types));
        type.setSelection("Charging".equals(currentReservation.optString("reservationType")) ? 1 : 0);

        clock.setIs24HourView(true);

        SimpleDateFormat dayFmt = new SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault());

        Runnable render = () -> {
            if (isDateMode[0]) {
                tvValue.setVisibility(View.VISIBLE);
                tvHint.setVisibility(View.VISIBLE);
                dayStepper.setVisibility(View.VISIBLE);
                clockWrap.setVisibility(View.GONE);
                tvValue.setText(String.valueOf(tmp.get(Calendar.DAY_OF_MONTH)));
                tvHint.setText(dayFmt.format(tmp.getTime()));
                tvSegDate.setBackgroundResource(R.drawable.bg_segment_selected);
                tvSegDate.setTypeface(null, Typeface.BOLD);
                tvSegTime.setBackgroundResource(0);
                tvSegTime.setTypeface(null, Typeface.NORMAL);
            } else {
                tvValue.setVisibility(View.GONE);
                tvHint.setVisibility(View.GONE);
                dayStepper.setVisibility(View.GONE);
                clockWrap.setVisibility(View.VISIBLE);
                tvSegTime.setBackgroundResource(R.drawable.bg_segment_selected);
                tvSegTime.setTypeface(null, Typeface.BOLD);
                tvSegDate.setBackgroundResource(0);
                tvSegDate.setTypeface(null, Typeface.NORMAL);
                syncingClock[0] = true;
                clock.setHour(tmp.get(Calendar.HOUR_OF_DAY));
                clock.setMinute(tmp.get(Calendar.MINUTE));
                syncingClock[0] = false;
            }
        };

        clock.setOnTimeChangedListener((v, hour, minute) -> {
            if (syncingClock[0]) return;
            tmp.set(Calendar.HOUR_OF_DAY, hour);
            tmp.set(Calendar.MINUTE, minute);
            render.run();
        });

        tvSegDate.setOnClickListener(v -> { isDateMode[0] = true; render.run(); });
        tvSegTime.setOnClickListener(v -> { isDateMode[0] = false; render.run(); });

        view.findViewById(R.id.btn_edit_minus).setOnClickListener(v -> {
            tmp.add(Calendar.DAY_OF_YEAR, -1);
            render.run();
        });
        view.findViewById(R.id.btn_edit_plus).setOnClickListener(v -> {
            tmp.add(Calendar.DAY_OF_YEAR, 1);
            render.run();
        });
        render.run();

        AlertDialog dialog = new AlertDialog.Builder(this).setView(view).create();
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }
        view.findViewById(R.id.btn_edit_save).setOnClickListener(v -> {
            dialog.dismiss();
            submitReservationUpdate(tmp, energy.getText().toString().trim(),
                    duration.getText().toString().trim(), type.getSelectedItem().toString());
        });
        view.findViewById(R.id.btn_edit_cancel).setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private void submitReservationUpdate(Calendar selected,
                                         String energyStr, String durationStr, String typeStr) {
        // Validate forward scheduling window (within 7 days) and PUT updated reservation to API
        try {
            Calendar now = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            Calendar maxDate = (Calendar) now.clone();
            maxDate.add(Calendar.DAY_OF_YEAR, 7);
            if (!selected.after(now) || selected.after(maxDate)) {
                tvError.setText("The booking must be scheduled in the future and within 7 days.");
                tvError.setVisibility(View.VISIBLE);
                return;
            }

            JSONObject body = new JSONObject();
            body.put("scheduledDateTime", toIsoUtc(selected));
            body.put("durationHours", Integer.parseInt(durationStr));
            body.put("energyAmountKWh", Double.parseDouble(energyStr));
            body.put("reservationType", typeStr);
            body.put("stationId", currentReservation.optString("stationId"));

            progressBar.setVisibility(View.VISIBLE);
            btnEdit.setEnabled(false);
            new Thread(() -> {
                try {
                    Request request = ApiClient.buildAuthRequest(this,
                            "reservations/" + reservationId + "?prosumerNic=" + prosumerNic)
                            .put(ApiClient.jsonBody(body)).build();
                    Response response = ApiClient.getClient().newCall(request).execute();
                    String responseBody = response.body().string();
                    JSONObject result = new JSONObject(responseBody);
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnEdit.setEnabled(true);
                        if (response.isSuccessful()) {
                            Toast.makeText(this, "Booking updated successfully.", Toast.LENGTH_LONG).show();
                            loadReservationDetail();
                        } else {
                            tvError.setText(result.optString("message", "Booking update failed."));
                            tvError.setVisibility(View.VISIBLE);
                        }
                    });
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnEdit.setEnabled(true);
                        tvError.setText("Network error: " + e.getMessage());
                        tvError.setVisibility(View.VISIBLE);
                    });
                }
            }).start();
        } catch (Exception e) {
            tvError.setText("Please enter valid reservation details.");
            tvError.setVisibility(View.VISIBLE);
        }
    }

    private String toIsoUtc(Calendar value) {
        // Format Calendar timestamp into ISO 8601 UTC string format expected by C# Web API
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(value.getTime());
    }

    /** Sends cancellation request to C# Web API. API enforces the 12-hour notice rule. */
    // Calls DELETE /api/reservations/{id}?prosumerNic=... (API returns error if < 12h notice)
    private void cancelReservation() {
        // DELETE /api/reservations/{id}?prosumerNic={nic} enforcing the strict 12-hour notice rule
        progressBar.setVisibility(View.VISIBLE);
        btnCancel.setEnabled(false);
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this,
                        "reservations/" + reservationId + "?prosumerNic=" + prosumerNic)
                        .delete().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String body = response.body().string();
                JSONObject json = new JSONObject(body);
                if (response.isSuccessful()) {
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        Toast.makeText(this, "Booking cancelled.", Toast.LENGTH_LONG).show();
                        finish();
                    });
                } else {
                    // API returns 12-hour rule violation message
                    String msg = json.optString("message", "Cancellation failed.");
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnCancel.setEnabled(true);
                        tvError.setText(msg);
                        tvError.setVisibility(View.VISIBLE);
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnCancel.setEnabled(true);
                    tvError.setText("Network error: " + e.getMessage());
                    tvError.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }
}