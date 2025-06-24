// src/components/SendEncouragement.jsx
import React, { useState, useEffect } from 'react';
import { addEncouragementNote, subscribeToAllUserDisplayNames } from '../services/firestoreService';
import { useFirebase } from '../firebase'; // To get the sender's UID
import { ChevronLeft } from 'lucide-react'; // Import ChevronLeft for a back button

const SendEncouragement = ({ onSendSuccess, onClose, showBackButton }) => { // Added showBackButton prop
    const { user, isAuthReady } = useFirebase();
    const [noteText, setNoteText] = useState('');
    const [recipients, setRecipients] = useState([]); // State to store all user profiles
    const [selectedRecipientId, setSelectedRecipientId] = useState(''); // State for the selected recipient UID
    const [message, setMessage] = useState(''); // For showing success/error messages inside the component
    const [isLoading, setIsLoading] = useState(false);

    // Effect to fetch all user display names
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && user) { // Fetch when auth is ready and user is logged in
            console.log("DEBUG SendEncouragement: Subscribing to all user display names.");
            unsubscribe = subscribeToAllUserDisplayNames((fetchedProfiles) => {
                // Filter out the current user from the list of recipients
                const filteredRecipients = fetchedProfiles.filter(profile => profile.id !== user?.uid);
                setRecipients(filteredRecipients);
                // Pre-select the first recipient if available and none is selected yet
                if (filteredRecipients.length > 0 && !selectedRecipientId) {
                    setSelectedRecipientId(filteredRecipients[0].id);
                } else if (filteredRecipients.length === 0) {
                    setSelectedRecipientId('');
                }
            });
        } else if (!user) {
            // Clear recipients if user logs out
            setRecipients([]);
            setSelectedRecipientId('');
        }

        return () => {
            if (unsubscribe) {
                console.log("DEBUG SendEncouragement: Unsubscribing from all user display names.");
                unsubscribe();
            }
        };
    }, [isAuthReady, user?.uid, selectedRecipientId]); // Depend on auth ready and user UID

    // Effect to clear messages after a delay
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000); // Clear messages after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
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
            // Find the selected recipient's display name
            const recipientDisplayName = recipients.find(r => r.id === selectedRecipientId)?.displayName || selectedRecipientId;
            const senderDisplayName = user.displayName || user.email || 'Anonymous Sender'; // Use current user's display name or email

            await addEncouragementNote(user.uid, selectedRecipientId, senderDisplayName, recipientDisplayName, noteText.trim());
            onSendSuccess(`Note sent to ${recipientDisplayName}!`);
            setNoteText('');
            // Reset selectedRecipientId if there are recipients, otherwise empty
            setSelectedRecipientId(recipients.length > 0 ? recipients[0].id : '');
        } catch (error) {
            console.error("Error sending note:", error);
            setMessage({ type: 'error', text: `Failed to send note: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-5 body-pad"> {/* Adjusted for full page */}
            {/* Conditional Back Button */}
            {showBackButton && (
                <button
                    onClick={onClose} // onClose will navigate back to courses page
                    className="mb-4 px-3 py-1 border border-black text-black rounded hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-1"
                >
                    <ChevronLeft size={16} /> Back to Courses
                </button>
            )}

            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-auto"> {/* Centered content */}
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
                            {recipients.length === 0 ? (
                                <option value="">Loading recipients...</option>
                            ) : (
                                recipients.map(recipient => (
                                    <option key={recipient.id} value={recipient.id}>
                                        {recipient.displayName || recipient.email}
                                    </option>
                                ))
                            )}
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                            placeholder="Type your encouragement here..."
                            disabled={isLoading}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
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

export default SendEncouragement;
