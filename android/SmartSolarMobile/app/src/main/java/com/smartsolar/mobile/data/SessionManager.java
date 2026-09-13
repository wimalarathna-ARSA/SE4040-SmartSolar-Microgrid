// ============================================================================
// File: SessionManager.java
// Author: IT22082510
// Course: SE4040 - Enterprise Application Development
// Description: Utility class for reading and clearing the authenticated user
//              session stored in SQLite by DatabaseHelper.
// ============================================================================
package com.smartsolar.mobile.data;

import android.content.Context;
import android.database.Cursor;

/** Utility for accessing the current authenticated user session from SQLite. */
public class SessionManager {

    private final DatabaseHelper dbHelper;

    /** Constructor - injects app context to initialize DatabaseHelper. */
    // Creates DatabaseHelper instance for session operations
    public SessionManager(Context context) {
        // Instantiate SQLite database helper instance for active session management
        dbHelper = new DatabaseHelper(context);
    }

     /** Returns true if a valid JWT session exists in SQLite. */
    // Checks if token is non-null and non-empty
    public boolean isLoggedIn() {
        // Verify presence of a non-empty JWT bearer token in the local SQLite session table
        String token = dbHelper.getToken();
        return token != null && !toAken.isEmpty();
    }

    /** Returns the logged-in user NIC from SQLite session. */
    // NIC is the primary business key for all prosumer operations
    public String getNic() {
        // Retrieve National Identity Card number acting as primary user identifier
        return dbHelper.getSessionNic();
    }

    /** Returns the logged-in user role from SQLite session. */
    // Role determines UI routing: Prosumer vs GridOperator
    public String getRole() {
        // Fetch assigned security role string for role-based dashboard navigation
        return dbHelper.getSessionRole();
    }

    /** Returns full name from session. */
    // Used for greeting labels in dashboard UI
    public String getFullName() {
        // Query user full name string from the active session cursor
        Cursor c = dbHelper.getSession();
        if (c != null && c.moveToFirst()) {
            String name = c.getString(c.getColumnIndexOrThrow(DatabaseHelper.COL_SESSION_NAME));
            c.close();
            return name;
        }
        return "";
    }

    /** Returns JWT Bearer token from SQLite. */
    // Used by ApiClient to authenticate requests
    public String getToken() {
        // Query stored JWT authentication token for API request headers
        return dbHelper.getToken();
    }
    
}
