import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase';
import { Copy, ChevronDown, ChevronUp, PlusCircle, Trash2, UserPlus, UserMinus, LogOut } from 'lucide-react';
import { parse } from 'date-fns';
import Papa from 'papaparse'; // <-- ADDED
import {
    setUserProfile,
    subscribeToAllUserProfiles,
    addTeam,
    subscribeToAllTeams,
    addTeamMember,
    removeTeamMember,
    deleteTeam,
    addCourseWithHoles,
    getUserCourses,
    updateCourse,
    addRound
} from '../services/firestoreService';
import ImportCSVModal from './ImportCSVModal';
import ConfirmationModal from './ConfirmationModal';
import SelectCourseTypeModal from './SelectCourseTypeModal';
import SelectPlayerModal from './SelectPlayerModal';

// --- NEW HELPER FUNCTIONS FOR INDEXEDDB (Client-side) ---
function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('dgnotes-shared-files', 1);
        request.onerror = event => reject("IndexedDB error: " + event.target.errorCode);
        request.onsuccess = event => resolve(event.target.result);
    });
}

async function getFile() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const allFilesRequest = store.getAll();
        allFilesRequest.onsuccess = () => {
            if (allFilesRequest.result && allFilesRequest.result.length > 0) {
                const sorted = allFilesRequest.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(sorted[0].file);
            } else {
                resolve(null);
            }
        };
        allFilesRequest.onerror = reject;
    });
}

async function clearFiles() {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.clear();
        request.onsuccess = resolve;
        request.onerror = reject;
    });
}
// --- END OF NEW HELPER FUNCTIONS ---


// Reusable Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    // ... (Accordion component is unchanged)
};

export default function SettingsPage({ onSignOut }) {
    // ... (All existing state is unchanged) ...

    // --- NEW useEffect TO CHECK FOR SHARED FILES ON PAGE LOAD ---
    useEffect(() => {
        const processSharedFile = async () => {
            const params = new URLSearchParams(window.location.search);
            if (params.has('share-target')) {
                setImportMessage({ type: 'info', text: 'Processing shared file...' });
                try {
                    const file = await getFile();
                    if (file) {
                        Papa.parse(file, {
                            header: true,
                            skipEmptyLines: true,
                            complete: (results) => {
                                // Trigger the same import handler used by the modal
                                handleCourseImport(results);
                            },
                            error: () => {
                                setImportMessage({ type: 'error', text: 'Failed to parse the shared CSV file.' });
                            }
                        });
                        await clearFiles(); // Clean up the database
                    } else {
                        setImportMessage({ type: 'info', text: 'No shared file found to process.' });
                    }
                } catch (error) {
                    setImportMessage({ type: 'error', text: 'Could not process shared file.' });
                } finally {
                    // Clean the URL so this doesn't run again on refresh
                    const url = new URL(window.location);
                    url.searchParams.delete('share-target');
                    window.history.replaceState({}, '', url);
                }
            }
        };

        processSharedFile();
    }, []); // Empty array ensures this runs only once when the page loads

    // ... (All existing handlers are unchanged) ...
    const handleCourseImport = async (csvResults) => {
        // ... (This entire function is unchanged from the last version)
    };

    // ... (All other functions are unchanged)

    if (!isAuthReady) return <div className="text-center p-4">Loading settings...</div>;
    if (!user) return <div className="text-center p-4">Please log in to view settings.</div>;

    return (
        // ... (The entire JSX for this component is unchanged) ...
    );
}