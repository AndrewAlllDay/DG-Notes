// src/components/SettingsPage.jsx
import React from 'react';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4">Data Management</h3>

                <p className="text-gray-700 mb-4">
                    Your course and hole data is now securely stored in Google Firebase. Automatic backups and synchronization are handled by Firebase. You can manage your data via the Firebase Console (console.firebase.google.com).
                </p>
            </div>

            {/* You can add more settings sections here in the future */}
            {/* For example: */}
            {/* <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6">
                <h3 className="text-xl font-semibold mb-4">Appearance</h3>
                <button className="px-4 py-2 bg-gray-200 rounded">Toggle Dark Mode</button>
            </div> */}

        </div>
    );
}