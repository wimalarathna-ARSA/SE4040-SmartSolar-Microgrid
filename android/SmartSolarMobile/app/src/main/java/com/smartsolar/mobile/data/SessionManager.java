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
}
