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
}
