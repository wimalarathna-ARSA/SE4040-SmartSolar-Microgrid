package com.smartsolar.mobile.ui.prosumer;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.*;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
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

        loadStations();
        btnPickDate.setOnClickListener(v -> showDateTimePicker());
        btnSubmit.setOnClickListener(v -> submitReservation());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!isFirstLoad) {
            loadStations();
        }
        isFirstLoad = false;
    }

    private void loadStations() {
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

    private void showDateTimePicker() {
        Calendar now = Calendar.getInstance();
        Calendar maxDate = Calendar.getInstance();
        maxDate.add(Calendar.DAY_OF_YEAR, 7);

        DatePickerDialog datePicker = new DatePickerDialog(this, (view, year, month, day) -> {
            Calendar selected = Calendar.getInstance();
            selected.set(year, month, day);

            if (selected.after(maxDate)) {
                tvError.setText("Bookings cannot be scheduled beyond 7 days from today (7-Day Rule).");
                tvError.setVisibility(View.VISIBLE);
                return;
            }

            new TimePickerDialog(this, (timeView, hour, minute) -> {
                selected.set(Calendar.HOUR_OF_DAY, hour);
                selected.set(Calendar.MINUTE, minute);
                selectedDateTime = selected;
                SimpleDateFormat sdf = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm", Locale.getDefault());
                tvSelectedDateTime.setText("Scheduled: " + sdf.format(selected.getTime()));
                tvError.setVisibility(View.GONE);
            }, 14, 0, true).show();

        }, now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH));

        datePicker.getDatePicker().setMinDate(now.getTimeInMillis());
        datePicker.getDatePicker().setMaxDate(maxDate.getTimeInMillis());
        datePicker.show();
    }

    private void updateSlotGrid(int stationIndex) {
        if (stationIndex < 0 || stationIndex >= stationList.size()) return;
        gridSlots.removeAllViews();
        selectedSlotNumber = -1;

        try {
            JSONObject station = stationList.get(stationIndex);
            int total = station.optInt("totalBatterySlots", 10);
            int avail = station.optInt("availableBatterySlots", 0);
            JSONArray occupiedArr = station.optJSONArray("occupiedSlotNumbers");
            Set<Integer> occupiedSlots = new HashSet<>();
            if (occupiedArr != null) {
                for (int j = 0; j < occupiedArr.length(); j++) {
                    occupiedSlots.add(occupiedArr.optInt(j));
                }
            }

            if (avail <= 0 || occupiedSlots.size() >= total) {
                tvSlotHint.setText("No slots available — this station is fully booked.");
                tvSlotHint.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
            } else {
                tvSlotHint.setText("Select an available slot. (" + avail + " of " + total + " available)");
                tvSlotHint.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
            }

            for (int i = 1; i <= total; i++) {
                final int slotNum = i;
                boolean isOccupied = occupiedSlots.contains(slotNum);
                boolean isAvailable = !isOccupied;

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
                    tvSlot.setEnabled(true);
                    tvSlot.setBackgroundResource(R.drawable.bg_neuro_btn_outline);
                    tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_green));
                    tvSlot.setOnClickListener(v -> selectSlot(slotNum, tvSlot));
                } else {
                    tvSlot.setEnabled(false);
                    tvSlot.setBackgroundResource(R.drawable.bg_neuro_inner_card);
                    tvSlot.setTextColor(ContextCompat.getColor(this, R.color.neuro_text_muted));
                    tvSlot.setAlpha(0.35f);
                    tvSlot.setOnClickListener(v -> {
                        Toast.makeText(this, "Slot #" + slotNum + " is already reserved. Please select a green slot.", Toast.LENGTH_SHORT).show();
                    });
                }
                
                gridSlots.addView(tvSlot);
            }
        } catch (Exception ignored) {}
    }

    private void selectSlot(int num, TextView view) {
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
        return (int) (dp * getResources().getDisplayMetrics().density);
    }

    private void submitReservation() {
        if (stationList.isEmpty()) { tvError.setText("No stations available."); tvError.setVisibility(View.VISIBLE); return; }
        if (selectedDateTime == null) { tvError.setText("Please select a date and time."); tvError.setVisibility(View.VISIBLE); return; }
        if (selectedSlotNumber == -1) { tvError.setText("Please select an available battery slot."); tvError.setVisibility(View.VISIBLE); return; }

        String energyStr = etEnergyKwh.getText().toString().trim();
        String durationStr = etDuration.getText().toString().trim();
        if (energyStr.isEmpty()) { tvError.setText("Please enter energy amount in kWh."); tvError.setVisibility(View.VISIBLE); return; }

        int stationIdx = spinnerStation.getSelectedItemPosition();
        String stationId;
        try {
            stationId = stationList.get(stationIdx).getString("id");
        } catch (Exception e) { return; }

        String type = spinnerType.getSelectedItem().toString().equals("Drop-Off (Sell Energy)") ? "DropOff" : "Charging";
        int duration = durationStr.isEmpty() ? 1 : Integer.parseInt(durationStr);

        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault());
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        String isoDateTime = isoFormat.format(selectedDateTime.getTime());

        performReservationSubmission(stationId, type, duration, energyStr, isoDateTime);
    }

    private void performReservationSubmission(String stationId, String type, int duration, String energyStr, String isoDateTime) {
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

                ApiClient.getClient().newCall(request).execute();
            } catch (Exception ignored) {}
        }).start();
    }
}