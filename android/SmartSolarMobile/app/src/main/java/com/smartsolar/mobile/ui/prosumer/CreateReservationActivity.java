package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

public class CreateReservationActivity extends AppCompatActivity {

    private Spinner spinnerStation, spinnerType;
    private EditText etEnergyKwh, etDuration;
    private TextView tvSelectedDateTime, tvError, tvSuccess, tvSlotHint;
    private Button btnPickDate, btnSubmit;
    private GridLayout gridSlots;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> stationList = new ArrayList<>();
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