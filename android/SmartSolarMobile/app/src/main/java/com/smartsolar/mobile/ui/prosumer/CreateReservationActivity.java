package com.smartsolar.mobile.ui.prosumer;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

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
        btnPickDate.setOnClickListener(v -> showDateTimePicker());
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

    private void setupStationSpinner(JSONArray array) {
        stationList.clear();
        List<String> stationNames = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            try {
                JSONObject s = array.getJSONObject(i);
                stationList.add(s);
                stationNames.add(s.getString("name") + " (" + s.optInt("availableBatterySlots") + " slots free)");
            } catch (Exception ignored) {}
        }
        
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
    }
}