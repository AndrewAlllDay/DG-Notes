// src/components/SendEncouragementModal.jsx
import React, { useState, useEffect } from 'react';
import { addEncouragementNote, subscribeToAllUserDisplayNames } from '../services/firestoreService';
import { useFirebase } from '../firebase'; // To get the sender's UID

const SendEncouragementModal = ({ isOpen, onClose, onSendSuccess }) => {
    const { user, isAuthReady } = useFirebase();
    const [noteText, setNoteText] = useState('');
    const [recipients, setRecipients] = useState([]); // State to store all user profiles
    const [selectedRecipientId, setSelectedRecipientId] = useState(''); // State for the selected recipient UID
    const [message, setMessage] = useState(''); // For showing success/error messages inside the modal
    const [isLoading, setIsLoading] = useState(false);

    // Effect to fetch all user display names when the modal opens
    useEffect(() => {
        let unsubscribe;
        if (isOpen && isAuthReady) {
            // Subscribe to all user display names
            unsubscribe = subscribeToAllUserDisplayNames((fetchedProfiles) => {
                // Filter out the current user from the list of recipients
                const filteredRecipients = fetchedProfiles.filter(profile => profile.id !== user?.uid);
                setRecipients(filteredRecipients);
                // Optionally pre-select the first recipient if available
                if (filteredRecipients.length > 0) {
                    setSelectedRecipientId(filteredRecipients[0].id);
                }
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isOpen, isAuthReady, user?.uid]); // Re-run when modal opens, auth ready, or user changes

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!user || !user.uid) {
            setMessage({ type: 'error', text: 'You must be logged in to send a note.' });
            return;
        }
        if (!selectedRecipientId) {
            setMessage({ type: 'error', text: 'Please select a recipient.' });
            return;
        }
        if (noteText.trim() === '') {
            setMessage({ type: 'error', text: 'Please enter a message.' });
            return;
        }

        setIsLoading(true);
        try {
            await addEncouragementNote(user.uid, selectedRecipientId, noteText.trim());
            onSendSuccess(`Note sent to ${recipients.find(r => r.id === selectedRecipientId)?.displayName || 'recipient'}!`);
            setNoteText('');
            setSelectedRecipientId(recipients.length > 0 ? recipients[0].id : ''); // Reset to first or empty
        } catch (error) {
            console.error("Error sending note:", error);
            setMessage({ type: 'error', text: `Failed to send note: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNoteText('');
        setSelectedRecipientId(recipients.length > 0 ? recipients[0].id : '');
        setMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm modal-content">
                <h2 className="text-2xl font-bold mb-4 text-center">Send Encouragement</h2>
                {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="recipient-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Send to:
                        </label>
                        <select
                            id="recipient-select"
                            value={selectedRecipientId}
                            onChange={(e) => setSelectedRecipientId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading || recipients.length === 0}
                        >
                            {recipients.length === 0 && <option value="">Loading recipients...</option>}
                            {recipients.map(recipient => (
                                <option key={recipient.id} value={recipient.id}>
                                    {recipient.displayName || recipient.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="note-text" className="block text-sm font-medium text-gray-700 mb-1">
                            Your Message:
                        </label>
                        <textarea
                            id="note-text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows="4"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your encouragement here..."
                            disabled={isLoading}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || !selectedRecipientId || noteText.trim() === ''}
                        >
                            {isLoading ? 'Sending...' : 'Send Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendEncouragementModal;
