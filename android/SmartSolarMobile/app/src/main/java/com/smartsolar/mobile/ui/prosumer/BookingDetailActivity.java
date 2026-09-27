package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.api.ApiClient;
import com.smartsolar.mobile.data.SessionManager;
import okhttp3.*;
import org.json.JSONObject;

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
                    tvStatus.setText("Status: " + json.optString("status"));
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
}