// ============================================================================
// File: ApiClient.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: OkHttp3 HTTP client for communicating with the central C# Web API.
//              Attaches JWT Bearer token from SQLite session on every request.
// Architecture: FAT Service Pattern - All business logic in Central C# Web API
// ============================================================================
package com.smartsolar.mobile.api;

import android.content.Context;
import com.smartsolar.mobile.data.DatabaseHelper;
import okhttp3.*;
import org.json.JSONObject;

/** Singleton OkHttp3 client for all REST API calls to the C# Smart Solar Web API. */
public class ApiClient {

    // Base URL points to C# ASP.NET Core API
    // For physical device: use PC's LAN IP (must be on same WiFi as phone)
    // For emulator: use 10.0.2.2:5000
    public static final String BASE_URL = "http://192.168.8.136:5000/api/";
    private static OkHttpClient httpClient;

    /** Returns the shared OkHttp3 client instance. */
    // Initializes OkHttpClient singleton with 30-second timeouts
    public static OkHttpClient getClient() {
        // Initialize or reuse singleton OkHttpClient configured with 30-second connection and read timeouts
        if (httpClient == null) {
            httpClient = new OkHttpClient.Builder()
                    .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .build();
        }
        return httpClient;
    }

    /** Builds an authenticated Request with Bearer token from SQLite session. */
    // Reads JWT from DatabaseHelper and attaches as Authorization header
    public static Request.Builder buildAuthRequest(Context context, String url) {
        // Retrieve cached JWT token from local SQLite database and attach as Authorization Bearer header
        DatabaseHelper db = new DatabaseHelper(context);
        String token = db.getToken();
        db.close();
        Request.Builder builder = new Request.Builder().url(BASE_URL + url);
        if (token != null && !token.isEmpty()) {
            builder.header("Authorization", "Bearer " + token);
        }
        return builder;
    }
}