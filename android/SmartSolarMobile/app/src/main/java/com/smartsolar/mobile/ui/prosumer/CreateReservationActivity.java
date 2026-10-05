// ============================================================================
// File: CreateReservationActivity.java
// Author: IT22166210
// Course: SE4040 - Enterprise Application Development
// Description: Prosumer energy slot booking screen. Fetches stations from API,
//              enforces 7-day forward booking window client-side (API also enforces),
//              creates Pending reservations for Backoffice approval (QR issued on approval).
// Architecture: FAT Service Pattern - 7-day rule enforced by C# Web API
// ============================================================================
package com.smartsolar.mobile.ui.prosumer;

import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.*;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.*;

/** Booking screen enforcing 7-day advance reservation rule. */
public class CreateReservationActivity extends AppCompatActivity {

    private Spinner spinnerStation, spinnerType;
    private EditText etEnergyKwh, etDuration;
    private TextView tvSelectedDateTime, tvError, tvSuccess, tvSlotHint;
    private Button btnPickDate, btnSubmit;
    private GridLayout gridSlots;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> stationList = new ArrayList<>();
    private Calendar selectedDateTime = null;
    private String preSelectedStationId;
    private int selectedSlotNumber = -1;

    private boolean isFirstLoad = true;

    /** Initializes form and loads available stations from C# Web API. */
    // Fetches station list and sets up date/time pickers
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Initialise session, bind form views, wire station selection, date picker, and submit button
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_reservation);

        sessionManager = new SessionManager(this);
        preSelectedStationId = getIntent().getStringExtra("selected_station_id");

        spinnerStation  = findViewById(R.id.spinner_station);
        spinnerType     = findViewById(R.id.spinner_type);
        etEnergyKwh     = findViewById(R.id.et_energy_kwh);
        etDuration      = findViewById(R.id.et_duration);
        tvSelectedDateTime = findViewById(R.id.tv_selected_datetime);
        tvError         = findViewById(R.id.tv_error);
        tvSuccess       = findViewById(R.id.tv_success);
        tvSlotHint      = findViewById(R.id.tv_selected_slot_hint);
        btnPickDate     = findViewById(R.id.btn_pick_date);
        btnSubmit       = findViewById(R.id.btn_submit);
        gridSlots       = findViewById(R.id.grid_slots);
        progressBar     = findViewById(R.id.progress_bar);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());
        
        spinnerStation.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int i, long id) { updateSlotGrid(i); }
            @Override public void onNothingSelected(AdapterView<?> p) {}
        });

        // Load stations from API for station picker
        loadStations();

        // Date and Time picker for reservation scheduling
        btnPickDate.setOnClickListener(v -> showDateTimePicker());

        // Submit booking to C# Web API
        btnSubmit.setOnClickListener(v -> submitReservation());
    }

    /**
     * Refresh station list on resume so slot grid always shows live counts
     * from the server (handles case where user navigates back after a booking).
     */
    @Override
    protected void onResume() {
        // Reload fleet stations from API on resume to ensure battery slot availability is up to date
        super.onResume();
        if (!isFirstLoad) {
            // Reload stations to get updated AvailableBatterySlots from API
            loadStations();
        }
        isFirstLoad = false;
    }

    /** Loads active solar stations from C# Web API and populates spinner. */
    // Calls GET /api/stations?status=Active and fills station spinner adapter
    private void loadStations() {
        // GET /api/stations?status=Active and populate the station spinner adapter
        progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                Request request = ApiClient.buildAuthRequest(this, "stations?status=Active").get().build();
                Response response = ApiClient.getClient().newCall(request).execute();
                String body = response.body().string();
                JSONArray array = new JSONArray(body);
                stationList.clear();
                List<String> stationNames = new ArrayList<>();
                for (int i = 0; i < array.length(); i++) {
                    JSONObject s = array.getJSONObject(i);
                    stationList.add(s);
                    stationNames.add(s.getString("name") + " (" + s.optInt("availableBatterySlots") + " slots free)");
                }
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    ArrayAdapter<String> adapter = new ArrayAdapter<>(this,
                            android.R.layout.simple_spinner_item, stationNames);
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                    spinnerStation.setAdapter(adapter);

                    // Auto-select if passed from map
                    if (preSelectedStationId != null) {
                        for (int i = 0; i < stationList.size(); i++) {
                            try {
                                if (preSelectedStationId.equals(stationList.get(i).getString("id"))) {
                                    spinnerStation.setSelection(i);
                                    break;
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    tvError.setText("Failed to load stations. Check network.");
                    tvError.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }

    /** Shows Adjust-Slots-style sheet for picking date (within 7 days) and time. */
    // Date mode uses day steppers; Time mode shows the analog clock circle
    private void showDateTimePicker() {
        // Working copy seeded from the current selection so Cancel discards changes
        final Calendar tmp = Calendar.getInstance();
        if (selectedDateTime != null) tmp.setTimeInMillis(selectedDateTime.getTimeInMillis());

        final Calendar minDay = Calendar.getInstance();
        stripTime(minDay);
        final Calendar maxDay = Calendar.getInstance();
        maxDay.add(Calendar.DAY_OF_YEAR, 7);
        stripTime(maxDay);
        clampDay(tmp, minDay, maxDay);

        View view = getLayoutInflater().inflate(R.layout.dialog_pick_datetime, null);
        TextView tvValue = view.findViewById(R.id.tv_pick_value);
        TextView tvHint = view.findViewById(R.id.tv_pick_hint);
        TextView tvSegDate = view.findViewById(R.id.tv_seg_date);
        TextView tvSegTime = view.findViewById(R.id.tv_seg_time);
        View dayStepper = view.findViewById(R.id.layout_day_stepper);
        View clockWrap = view.findViewById(R.id.layout_clock_wrap);
        TimePicker clock = view.findViewById(R.id.time_picker_clock);
        final boolean[] isDateMode = {true};
        final boolean[] syncingClock = {false};

        clock.setIs24HourView(true);

        SimpleDateFormat dayFmt = new SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault());

        Runnable render = () -> {
            if (isDateMode[0]) {
                tvValue.setVisibility(View.VISIBLE);
                tvHint.setVisibility(View.VISIBLE);
                dayStepper.setVisibility(View.VISIBLE);
                clockWrap.setVisibility(View.GONE);
                tvValue.setTextSize(72);
                tvValue.setText(String.valueOf(tmp.get(Calendar.DAY_OF_MONTH)));
                tvHint.setText(dayFmt.format(tmp.getTime()));
                tvSegDate.setBackgroundResource(R.drawable.bg_segment_selected);
                tvSegDate.setTypeface(null, Typeface.BOLD);
                tvSegTime.setBackgroundResource(0);
                tvSegTime.setTypeface(null, Typeface.NORMAL);
            } else {
                // Time mode: clock face carries the time (header + dial), so the big
                // duplicate readout is hidden and the full clock gets the space
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

        view.findViewById(R.id.btn_pick_minus).setOnClickListener(v -> {
            Calendar next = (Calendar) tmp.clone();
            next.add(Calendar.DAY_OF_YEAR, -1);
            if (inDayRange(next, minDay, maxDay)) { tmp.add(Calendar.DAY_OF_YEAR, -1); render.run(); }
            else Toast.makeText(this, "Bookings only within 7 days from today.", Toast.LENGTH_SHORT).show();
        });
        view.findViewById(R.id.btn_pick_plus).setOnClickListener(v -> {
            Calendar next = (Calendar) tmp.clone();
            next.add(Calendar.DAY_OF_YEAR, 1);
            if (inDayRange(next, minDay, maxDay)) { tmp.add(Calendar.DAY_OF_YEAR, 1); render.run(); }
            else Toast.makeText(this, "Bookings only within 7 days from today.", Toast.LENGTH_SHORT).show();
        });
        render.run();

        AlertDialog dialog = new AlertDialog.Builder(this).setView(view).create();
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }
        view.findViewById(R.id.btn_pick_save).setOnClickListener(v -> {
            selectedDateTime = (Calendar) tmp.clone();
            SimpleDateFormat sdf = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm", Locale.getDefault());
            tvSelectedDateTime.setText("Scheduled: " + sdf.format(selectedDateTime.getTime()));
            tvError.setVisibility(View.GONE);
            dialog.dismiss();
        });
        view.findViewById(R.id.btn_pick_cancel).setOnClickListener(v -> dialog.dismiss());
        dialog.show();
    }

    private static void stripTime(Calendar c) {
        // Zero time fields so day comparisons ignore clock time
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
    }

    private static boolean inDayRange(Calendar day, Calendar min, Calendar max) {
        // Day-precision range check against the 7-day booking window
        Calendar d = (Calendar) day.clone();
        stripTime(d);
        return !d.before(min) && !d.after(max);
    }

    private static void clampDay(Calendar day, Calendar min, Calendar max) {
        // Pull an out-of-window day back to the nearest valid edge
        Calendar d = (Calendar) day.clone();
        stripTime(d);
        if (d.before(min)) {
            day.set(Calendar.YEAR, min.get(Calendar.YEAR));
            day.set(Calendar.DAY_OF_YEAR, min.get(Calendar.DAY_OF_YEAR));
        } else if (d.after(max)) {
            day.set(Calendar.YEAR, max.get(Calendar.YEAR));
            day.set(Calendar.DAY_OF_YEAR, max.get(Calendar.DAY_OF_YEAR));
        }
    }

    private void updateSlotGrid(int stationIndex) {
        // Dynamically construct battery slot grid buttons indicating free, busy, and reserved slots
        if (stationIndex < 0 || stationIndex >= stationList.size()) return;
        gridSlots.removeAllViews();
        selectedSlotNumber = -1;

        try {
            JSONObject station = stationList.get(stationIndex);
            int total = station.optInt("totalBatterySlots", 10);
            int avail = station.optInt("availableBatterySlots", 0);

            // Occupied by prosumer bookings
            JSONArray occupiedArr = station.optJSONArray("occupiedSlotNumbers");
            Set<Integer> occupiedSlots = new HashSet<>();
            if (occupiedArr != null) {
                for (int j = 0; j < occupiedArr.length(); j++) {
                    occupiedSlots.add(occupiedArr.optInt(j));
                }
            }

            // Marked busy by operator — prosumers cannot book these
            JSONArray busyArr = station.optJSONArray("busySlotNumbers");
            Set<Integer> busySlots = new HashSet<>();
            if (busyArr != null) {
                for (int j = 0; j < busyArr.length(); j++) {
                    busySlots.add(busyArr.optInt(j));
                }
            }

            if (avail <= 0) {
                tvSlotHint.setText("No slots available — this station is fully booked.");
                tvSlotHint.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
            } else {
                tvSlotHint.setText("Select an available slot. (" + avail + " of " + total + " available)");
                tvSlotHint.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
            }

            for (int i = 1; i <= total; i++) {
                final int slotNum = i;
                boolean isBusy     = busySlots.contains(slotNum);
                boolean isOccupied = occupiedSlots.contains(slotNum);
                boolean isAvailable = !isBusy && !isOccupied;

                TextView tvSlot = new TextView(this);
                GridLayout.LayoutParams params = new GridLayout.LayoutParams();
                params.width = dpToPx(54);
                params.height = dpToPx(54);
                params.setMargins(dpToPx(6), dpToPx(6), dpToPx(6), dpToPx(6));
                tvSlot.setLayoutParams(params);
                tvSlot.setGravity(Gravity.CENTER);
                tvSlot.setText(String.valueOf(i));
                tvSlot.setTextSize(14f);
                tvSlot.setTypeface(null, Typeface.BOLD);

                if (isAvailable) {
                    // Free — selectable (green outline)
                    tvSlot.setEnabled(true);
                    tvSlot.setBackgroundResource(R.drawable.bg_neuro_btn_outline);
                    tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                    tvSlot.setOnClickListener(v -> selectSlot(slotNum, tvSlot));
                } else if (isBusy) {
                    // Marked busy by operator — amber, not bookable
                    tvSlot.setEnabled(false);
                    tvSlot.setBackgroundResource(R.drawable.bg_slot_busy);
                    tvSlot.setTextColor(android.graphics.Color.parseColor("#D97706"));
                    final String busyMsg = "Slot #" + slotNum + " is marked Busy by the operator and cannot be booked.";
                    tvSlot.setOnClickListener(v ->
                            Toast.makeText(this, busyMsg, Toast.LENGTH_SHORT).show());
                } else {
                    // Booked by another prosumer — muted/dimmed
                    tvSlot.setEnabled(false);
                    tvSlot.setBackgroundResource(R.drawable.bg_neuro_inner_card);
                    tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                    tvSlot.setAlpha(0.35f);
                    tvSlot.setOnClickListener(v ->
                            Toast.makeText(this, "Slot #" + slotNum + " is already reserved. Please select a green slot.", Toast.LENGTH_SHORT).show());
                }

                gridSlots.addView(tvSlot);
            }
        } catch (Exception ignored) {}
    }

    private void selectSlot(int num, TextView view) {
        // Select a specific available slot number, update view styling and feedback hint
        // Reset previous selection on all available slots
        for (int i = 0; i < gridSlots.getChildCount(); i++) {
            View child = gridSlots.getChildAt(i);
            if (child.isEnabled()) {
                child.setBackgroundResource(R.drawable.bg_neuro_btn_outline);
                ((TextView) child).setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
            }
        }
        
        selectedSlotNumber = num;
        view.setBackgroundResource(R.drawable.bg_neuro_btn_green);
        view.setTextColor(ContextCompat.getColor(this, R.color.text_on_accent));
        tvSlotHint.setText("Slot #" + num + " selected.");
        tvSlotHint.setTextColor(ContextCompat.getColor(this, R.color.neuro_green));
    }

    private int dpToPx(int dp) {
        // Helper to convert density-independent pixels to physical screen pixels
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    /** Submits reservation to C# Web API as Pending and opens the booking pass on success. */
    // Posts to POST /api/reservations?prosumerNic=... and navigates to BookingDetailActivity on success
    private void submitReservation() {
        // Validate inputs, format ISO 8601 UTC timestamp, and present booking confirmation dialog
        if (stationList.isEmpty()) { tvError.setText("No stations available."); tvError.setVisibility(View.VISIBLE); return; }
        if (selectedDateTime == null) { tvError.setText("Please select a date and time."); tvError.setVisibility(View.VISIBLE); return; }
        if (selectedSlotNumber == -1) { tvError.setText("Please select an available battery slot."); tvError.setVisibility(View.VISIBLE); return; }

        String energyStr = etEnergyKwh.getText().toString().trim();
        String durationStr = etDuration.getText().toString().trim();
        if (energyStr.isEmpty()) { tvError.setText("Please enter energy amount in kWh."); tvError.setVisibility(View.VISIBLE); return; }

        int stationIdx = spinnerStation.getSelectedItemPosition();
        String stationId, stationName;
        try {
            stationId = stationList.get(stationIdx).getString("id");
            stationName = stationList.get(stationIdx).getString("name");
        } catch (Exception e) { return; }

        String type = spinnerType.getSelectedItem().toString().equals("Drop-Off (Sell Energy)") ? "DropOff" : "Charging";
        int duration = durationStr.isEmpty() ? 1 : Integer.parseInt(durationStr);

        // Format DateTime as ISO 8601 for C# API
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault());
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        String isoDateTime = isoFormat.format(selectedDateTime.getTime());

        // Display professional confirmation sheet with round margins
        SimpleDateFormat displayFormat = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm", Locale.getDefault());
        String typeLabel = type.equals("DropOff") ? "Drop-Off" : "Charging";

        View confirmView = getLayoutInflater().inflate(R.layout.dialog_confirm_booking, null);
        ((TextView) confirmView.findViewById(R.id.tv_confirm_station)).setText(stationName);
        ((TextView) confirmView.findViewById(R.id.tv_confirm_slot)).setText("Slot #" + selectedSlotNumber);
        ((TextView) confirmView.findViewById(R.id.tv_confirm_scheduled)).setText(displayFormat.format(selectedDateTime.getTime()));
        ((TextView) confirmView.findViewById(R.id.tv_confirm_energy)).setText(energyStr + " kWh");
        ((TextView) confirmView.findViewById(R.id.tv_confirm_type)).setText(typeLabel);

        AlertDialog confirmDialog = new AlertDialog.Builder(this).setView(confirmView).create();
        if (confirmDialog.getWindow() != null) {
            confirmDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }
        confirmView.findViewById(R.id.btn_confirm_go).setOnClickListener(v -> {
            confirmDialog.dismiss();
            performReservationSubmission(stationId, type, duration, energyStr, isoDateTime);
        });
        confirmView.findViewById(R.id.btn_confirm_cancel).setOnClickListener(v -> confirmDialog.dismiss());
        confirmDialog.show();
    }

    private void performReservationSubmission(String stationId, String type, int duration, String energyStr, String isoDateTime) {
        // POST new reservation payload to /api/reservations and navigate to summary page with QR code
        progressBar.setVisibility(View.VISIBLE);
        btnSubmit.setEnabled(false);
        tvError.setVisibility(View.GONE);

        String nic = sessionManager.getNic();

        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("stationId", stationId);
                body.put("slotNumber", selectedSlotNumber);
                body.put("scheduledDateTime", isoDateTime);
                body.put("durationHours", duration);
                body.put("energyAmountKWh", Double.parseDouble(energyStr));
                body.put("reservationType", type);

                Request request = ApiClient.buildAuthRequest(this,
                        "reservations?prosumerNic=" + nic)
                        .post(ApiClient.jsonBody(body)).build();

                Response response = ApiClient.getClient().newCall(request).execute();
                String responseBody = response.body().string();
                JSONObject json = new JSONObject(responseBody);

                if (response.isSuccessful()) {
                    // Navigate to Booking Detail (booking pass); QR appears only after approval
                    String reservationId = json.optString("id");
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        Intent intent = new Intent(this, BookingDetailActivity.class);
                        intent.putExtra("reservation_id", reservationId);
                        intent.putExtra("show_summary", true);
                        startActivity(intent);
                        finish();
                    });
                } else {
                    String msg = json.optString("message", "Booking failed.");
                    runOnUiThread(() -> {
                        progressBar.setVisibility(View.GONE);
                        btnSubmit.setEnabled(true);
                        tvError.setText(msg); // Shows API error (e.g. 7-day rule violation)
                        tvError.setVisibility(View.VISIBLE);
                    });
                }
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    btnSubmit.setEnabled(true);
                    tvError.setText("Network error: " + e.getMessage());
                    tvError.setVisibility(View.VISIBLE);
                });
            }
        }).start();
    }
}