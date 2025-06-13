// src/components/SettingsPage.jsx
import React, { useState, useEffect } from 'react'; // We need useEffect to load data

export default function SettingsPage() {
    // This component will load its own data for export, mirroring how Courses loads it.
    // This avoids prop drilling if settings don't need real-time updates from Courses.
    const [coursesData, setCoursesData] = useState([]);

    // Load data from localStorage when the component mounts
    useEffect(() => {
        const saved = localStorage.getItem('courses'); // Use the same key as in Courses.jsx
        if (saved) {
            setCoursesData(JSON.parse(saved));
        }
    }, []); // Empty dependency array means this runs once on mount

    const handleExportData = () => {
        if (coursesData.length === 0) {
            alert("No data to export!");
            return;
        }

        const dataToExport = JSON.stringify(coursesData, null, 2);
        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `disc-golf-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("Your data has been exported as a JSON file!");
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                // Basic validation: Check if it's an array and has expected properties
                if (Array.isArray(importedData) && importedData.every(c => c.id && c.name && Array.isArray(c.holes))) {
                    // Ask for confirmation before overwriting existing data
                    if (window.confirm("Importing data will overwrite your current courses. Are you sure?")) {
                        localStorage.setItem('courses', JSON.stringify(importedData));
                        setCoursesData(importedData); // Update local state immediately
                        alert("Data imported successfully! Please refresh the page or navigate to Courses to see changes.");
                        // For changes to reflect in the Courses component, you might need a page reload
                        // or a more sophisticated state management system/context.
                        // For now, refreshing is the easiest way.
                    }
                } else {
                    alert("Invalid JSON format for Disc Golf Notes data. Please select a valid backup file.");
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                alert("Failed to import data. Please ensure the file is a valid JSON backup.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-xl font-semibold mb-4">Data Management</h3>

                <p className="text-gray-700 mb-4">
                    Export all your course and hole data to a JSON file for backup. You can import this file later.
                </p>
                <button
                    onClick={handleExportData}
                    className="w-full px-4 py-2 !bg-green-600 hover:bg-blue-700 text-white rounded shadow-md transition-colors duration-200 mb-4"
                >
                    Export All Data
                </button>

                <p className="text-gray-700 mb-4">
                    Import data from a previously exported JSON file. This will overwrite your current data.
                </p>
                <label className="w-full flex items-center justify-center px-4 py-2 !bg-blue-600 hover:bg-purple-700 text-white rounded shadow-md cursor-pointer transition-colors duration-200">
                    Import Data
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                    />
                </label>
            </div>

            {/* You can add more settings sections here */}
            {/* <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6">
                <h3 className="text-xl font-semibold mb-4">Theme</h3>
                <button className="px-4 py-2 bg-gray-200 rounded">Toggle Dark Mode</button>
            </div> */}

        </div>
    );
}