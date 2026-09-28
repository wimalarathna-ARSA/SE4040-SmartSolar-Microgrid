package com.smartsolar.mobile.ui.prosumer;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.mobile.R;
import com.smartsolar.mobile.data.SessionManager;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class EnergyTransferHistoryActivity extends AppCompatActivity {

    private RecyclerView recyclerView;
    private TextView tvEmpty;
    private View progressBar;
    private SessionManager sessionManager;
    private List<JSONObject> transferList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_energy_transfer_history);

        sessionManager = new SessionManager(this);

        findViewById(R.id.btn_back_header).setOnClickListener(v -> finish());

        recyclerView = findViewById(R.id.recycler_transfers);
        tvEmpty      = findViewById(R.id.tv_empty);
        progressBar   = findViewById(R.id.progress_bar);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
    }
}