import React, { useEffect, useState } from 'react';

// Import the new, single-responsibility components and hooks
import Accordion from '../components/settings/Accordion';
import AccountSettings from '../components/settings/AccountSettings';
import EncouragementSender from '../components/settings/EncouragementSender';
import ScorecardManager from '../components/settings/ScorecardManager';
import AdminUserManagement from '../components/settings/AdminUserManagement';
import AdminTeamManagement from '../components/settings/AdminTeamManagement';

// Import utilities that were previously inside this file
import { getFile, clearFiles } from '../utilities/fileCache';
import Papa from 'papaparse';

/**
 * The main SettingsPage component, now acting as a clean container or "orchestrator".
 * It arranges the feature-specific components within accordions.
 * All complex state and logic is now delegated to the child components.
 */
export default function SettingsPage({ user, allUserProfiles, onSignOut, onNavigate, params = {} }) {
    const APP_VERSION = 'v 0.1.56';

    // State to track if the page is loading
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const processSharedFile = async (fileToProcess) => {
            if (!fileToProcess) return;

            console.log("Processing shared file...", fileToProcess);
            // In a fully refactored version, this would likely call a function
            // from a `useCsvImporter` hook passed down to ScorecardManager.
            // For now, we'll keep the trigger logic here.

            // Example of how it might be triggered (logic is inside ScorecardManager):
            // Papa.parse(...); 

            await clearFiles();
        };

        const checkForImportTrigger = async () => {
            if (params.sharedFile) {
                await processSharedFile(params.sharedFile);
            } else if (params.triggerImport) {
                const file = await getFile();
                await processSharedFile(file);
            }
        };

        if (user?.uid) {
            checkForImportTrigger().then(() => {
                setIsLoading(false); // Set loading to false after the check is complete
            });
        } else {
            setIsLoading(false); // If there's no user, we're not loading anything
        }
    }, [params, user?.uid]);

    if (!user) {
        return <div className="text-center p-4">Please log in to view settings.</div>;
    }

    // Conditionally render the loader or the content
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
                <style jsx>{`
          .loader {
            border-top-color: #3498db;
            -webkit-animation: spin 1s linear infinite;
            animation: spin 1s linear infinite;
          }
          @-webkit-keyframes spin {
            0% { -webkit-transform: rotate(0deg); }
            100% { -webkit-transform: rotate(360deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black p-4 pb-48">
            <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">Settings</h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mb-6 p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">
                    Your Account
                </h3>
                <AccountSettings user={user} onSignOut={onSignOut} />
            </div>

            <Accordion title="Send Encouragement">
                <EncouragementSender user={user} allUserProfiles={allUserProfiles} />
            </Accordion>

            <Accordion title="Manage Scorecards">
                <ScorecardManager onNavigate={onNavigate} />
            </Accordion>

            {user.role === 'admin' && (
                <>
                    <Accordion title="User Role Management">
                        <AdminUserManagement currentUser={user} allUserProfiles={allUserProfiles} />
                    </Accordion>
                    <Accordion title="Team Management">
                        <AdminTeamManagement allUserProfiles={allUserProfiles} />
                    </Accordion>
                </>
            )}

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                FlightLog: {APP_VERSION}
            </div>

        </div>
    );
}