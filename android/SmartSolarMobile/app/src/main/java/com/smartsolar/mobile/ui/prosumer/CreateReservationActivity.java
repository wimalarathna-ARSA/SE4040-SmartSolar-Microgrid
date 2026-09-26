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
import com.smartsolar.mobile.data.SessionManager;
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

        btnPickDate.setOnClickListener(v -> showDateTimePicker());
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
}