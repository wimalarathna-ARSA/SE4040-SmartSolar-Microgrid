package com.smartsolar.mobile.ui.prosumer;


import android.content.Intent;
import android.graphics.Bitmap;
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

public class BookingDetailActivity extends AppCompatActivity {

    private TextView tvCode, tvStation, tvScheduled, tvEnergy, tvCost, tvStatus, tvType, tvSlot, tvQrHint, tvError, tvSummaryHeader;
    private ImageView ivQrCode;
    private Button btnEdit, btnCancel, btnBack;
    private View progressBar;
    private SessionManager sessionManager;
    private String reservationId, prosumerNic;
    private JSONObject currentReservation;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_detail);

        sessionManager = new SessionManager(this);
        reservationId  = getIntent().getStringExtra("reservation_id");
        prosumerNic    = sessionManager.getNic();
        boolean showSummary = getIntent().getBooleanExtra("show_summary", false);

        tvCode         = findViewById(R.id.tv_code);
        tvStation      = findViewById(R.id.tv_station);
        tvScheduled    = findViewById(R.id.tv_scheduled);
        tvEnergy       = findViewById(R.id.tv_energy);
        tvCost         = findViewById(R.id.tv_cost);
        tvStatus       = findViewById(R.id.tv_status);
        tvType         = findViewById(R.id.tv_type);
        tvSlot         = findViewById(R.id.tv_slot);
        tvQrHint       = findViewById(R.id.tv_qr_hint);
        tvError        = findViewById(R.id.tv_error);
        tvSummaryHeader = findViewById(R.id.tv_summary_header);
        ivQrCode       = findViewById(R.id.iv_qr_code);
        btnEdit        = findViewById(R.id.btn_edit);
        btnCancel      = findViewById(R.id.btn_cancel);
        btnBack        = findViewById(R.id.btn_back);
        progressBar    = findViewById(R.id.progress_bar);

        if (showSummary) {
            tvSummaryHeader.setText("Booking Confirmed!");
            tvSummaryHeader.setVisibility(View.VISIBLE);
        }

        loadReservationDetail();

        btnEdit.setOnClickListener(v -> showEditReservationDialog());
        btnCancel.setOnClickListener(v -> cancelReservation());
        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        btnBack.setOnClickListener(v -> finish());
    }

    private void loadReservationDetail() {
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
                    String rawScheduled = json.optString("scheduledDateTime", "");
                    String displayScheduled = rawScheduled;
                    try {
                        java.text.SimpleDateFormat utcParser = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault());
                        utcParser.setTimeZone(TimeZone.getTimeZone("UTC"));
                        java.util.Date parsedDate = utcParser.parse(rawScheduled.length() > 19 ? rawScheduled.substring(0, 19) : rawScheduled);
                        java.text.SimpleDateFormat localFormatter = new java.text.SimpleDateFormat("EEE, dd MMM yyyy HH:mm", Locale.getDefault());
                        localFormatter.setTimeZone(TimeZone.getDefault());
                        displayScheduled = localFormatter.format(parsedDate);
                    } catch (Exception ignored) {
                        displayScheduled = rawScheduled.replace("T", " ").substring(0, Math.min(16, rawScheduled.length()));
                    }
                    tvScheduled.setText("Scheduled: " + displayScheduled);
                    tvEnergy.setText("Energy: " + json.optDouble("energyAmountKWh") + " kWh for " + json.optInt("durationHours") + " hr(s)");
                    tvSlot.setText("Battery Slot: #" + json.optInt("slotNumber", 0));
                    tvCost.setText("Estimated Value: Rs. " + String.format("%.2f", json.optDouble("totalCost")));
                    tvStatus.setText("Status: " + json.optString("status"));
                    tvType.setText("Type: " + ("DropOff".equals(json.optString("reservationType")) ? "Drop-Off (Selling to Grid)" : "Charging (Buying from Grid)"));

                    String qrData = json.optString("qrCodeData", "");
                    String status = json.optString("status");
                    if ("Approved".equals(status) && !qrData.isEmpty()) {
                        generateQrCode(qrData);
                        tvQrHint.setText("Show this QR code to the Grid Operator at the solar hub.");
                        tvQrHint.setVisibility(View.VISIBLE);
                        ivQrCode.setVisibility(View.VISIBLE);
                    }

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

    private void generateQrCode(String qrData) {
        try {
            BarcodeEncoder encoder = new BarcodeEncoder();
            Bitmap bitmap = encoder.encodeBitmap(qrData, BarcodeFormat.QR_CODE, 400, 400);
            ivQrCode.setImageBitmap(bitmap);
        } catch (Exception e) {
            tvQrHint.setText("QR code could not be rendered.");
        }
    }

    private void showEditReservationDialog() {
        if (currentReservation == null) return;

        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        int padding = (int) (20 * getResources().getDisplayMetrics().density);
        form.setPadding(padding, 0, padding, 0);

        TextView policy = new TextView(this);
        policy.setText("Edits require at least 12 hours before the scheduled start time.");
        policy.setPadding(0, 0, 0, padding / 2);
        form.addView(policy);

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

        DatePicker datePicker = new DatePicker(this);
        datePicker.init(scheduled.get(Calendar.YEAR), scheduled.get(Calendar.MONTH), scheduled.get(Calendar.DAY_OF_MONTH), null);
        form.addView(datePicker);

        TimePicker timePicker = new TimePicker(this);
        timePicker.setIs24HourView(true);
        timePicker.setHour(scheduled.get(Calendar.HOUR_OF_DAY));
        timePicker.setMinute(scheduled.get(Calendar.MINUTE));
        form.addView(timePicker);

        EditText energy = new EditText(this);
        energy.setHint("Energy amount (kWh)");
        energy.setInputType(android.text.InputType.TYPE_CLASS_NUMBER | android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL);
        energy.setText(String.valueOf(currentReservation.optDouble("energyAmountKWh", 0)));
        form.addView(energy);

        EditText duration = new EditText(this);
        duration.setHint("Duration (hours)");
        duration.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        duration.setText(String.valueOf(currentReservation.optInt("durationHours", 1)));
        form.addView(duration);

        Spinner type = new Spinner(this);
        String[] types = {"DropOff", "Charging"};
        type.setAdapter(new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, types));
        type.setSelection("Charging".equals(currentReservation.optString("reservationType")) ? 1 : 0);
        form.addView(type);

        ScrollView scrollView = new ScrollView(this);
        scrollView.setFillViewport(true);
        scrollView.addView(form);

        new AlertDialog.Builder(this)
                .setTitle("Edit Reservation")
                .setView(scrollView)
                .setPositiveButton("Save Changes", (dialog, which) -> submitReservationUpdate(datePicker, timePicker, energy, duration, type))
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }

    private void submitReservationUpdate(DatePicker datePicker, TimePicker timePicker, EditText energy,
                                         EditText duration, Spinner type) {
        try {
            Calendar selected = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            selected.set(datePicker.getYear(), datePicker.getMonth(), datePicker.getDayOfMonth(),
                    timePicker.getHour(), timePicker.getMinute(), 0);

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
            body.put("durationHours", Integer.parseInt(duration.getText().toString().trim()));
            body.put("energyAmountKWh", Double.parseDouble(energy.getText().toString().trim()));
            body.put("reservationType", type.getSelectedItem().toString());
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
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.format(value.getTime());
    }

    private void cancelReservation() {
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