import React, { useState, useCallback, useEffect } from 'react';
import { LogOut, Save } from 'lucide-react';
import { setUserProfile } from '../../services/firestoreService';

const AccountSettings = React.memo(({ user, onSignOut }) => {
    // ✨ State related to account settings is now co-located here
    const [displayNameInput, setDisplayNameInput] = useState('');
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    // This effect syncs the input field if the user prop changes
    useEffect(() => {
        if (user) {
            setDisplayNameInput(user.displayName || '');
        }
    }, [user]);

    const handleSaveDisplayName = useCallback(async () => {
        if (!user?.uid || !displayNameInput.trim()) {
            setSaveMessage({ type: 'error', text: 'Display Name cannot be empty.' });
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
            return;
        }

        try {
            await setUserProfile(user.uid, { displayName: displayNameInput.trim() });
            setSaveMessage({ type: 'success', text: 'Display Name saved!' });
        } catch (error) {
            setSaveMessage({ type: 'error', text: `Failed to save: ${error.message}` });
        } finally {
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        }
    }, [user?.uid, displayNameInput]);

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Set Your Display Name:
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        id="displayName"
                        className="flex-grow p-2 border border-gray-300 rounded-md !bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder="e.g., Disc Golf Pro"
                    />
                    <button
                        onClick={handleSaveDisplayName}
                        className="p-2 !bg-green-600 text-white rounded-md hover:!bg-green-700"
                        aria-label="Save Display Name"
                    >
                        <Save size={20} />
                    </button>
                </div>
                {saveMessage.text && (
                    <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {saveMessage.text}
                    </p>
                )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-0">
                <span className="font-semibold">Username:</span> {user.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
                <span className="font-semibold">Your Role:</span> {user.role || 'player'}
            </p>

            <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 !bg-red-600 text-white mt-5 p-3 rounded-md font-semibold hover:bg-red-700"
            >
                <LogOut size={20} />
                Logout
            </button>
        </div>
    );
});

export default AccountSettings;