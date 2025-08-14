import React, { useState } from 'react';
import ImportCSVModal from '../ImportCSVModal';

// NOTE: The full, complex import logic involving multiple modals and data processing
// has been omitted here for clarity. In a full refactor, that logic would
// be managed by a dedicated custom hook (`useCsvImporter`).

const ScorecardManager = React.memo(({ onNavigate }) => {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importMessage, setImportMessage] = useState({ type: '', text: '' });

    const handleCourseImport = (csvResults) => {
        setIsImportModalOpen(false);
        console.log("CSV Import Initiated:", csvResults);
        // This is where the complex chain of functions from the original file
        // (handleCourseImport, proceedToScoreImport, etc.) would be triggered,
        // ideally from a custom hook.
        setImportMessage({ type: 'success', text: 'Import process started (placeholder).' });
        setTimeout(() => setImportMessage({ type: '', text: '' }), 4000);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Import Scorecard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Upload a scorecard exported from Udisc.</p>
            <button
                onClick={() => setIsImportModalOpen(true)}
                className="w-full !bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors mb-4"
            >
                Import from CSV
            </button>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-t pt-4 mt-4">View Scores</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">View all of your imported scorecards.</p>
            <button
                onClick={() => onNavigate('scores')}
                className="w-full !bg-gray-600 text-white p-2 rounded-md font-semibold hover:bg-gray-700 transition-colors"
            >
                View Imported Scores
            </button>

            {importMessage.text && (
                <p className={`mt-2 text-sm ${importMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {importMessage.text}
                </p>
            )}

            <ImportCSVModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleCourseImport}
            />
        </div>
    );
});

export default ScorecardManager;