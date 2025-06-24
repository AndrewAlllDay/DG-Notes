// src/components/SendEncouragement.jsx
import React, { useState, useEffect } from 'react';
import { addEncouragementNote, subscribeToAllUserDisplayNames } from '../services/firestoreService';
import { useFirebase } from '../firebase'; // To get the sender's UID
// Removed ChevronLeft as it's no longer used for the back button
// import { ChevronLeft } from 'lucide-react'; // Removed import

const SendEncouragement = ({ onSendSuccess, onClose, showBackButton }) => { // showBackButton prop is now effectively unused
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
                const currentUserId = user?.uid;
                const currentUserTeamIds = user?.teamIds || []; // Get current user's team IDs

                // Filter out the current user from the list of recipients
                let filteredRecipients = fetchedProfiles.filter(profile => profile.id !== currentUserId);

                // Apply team-based filtering unless the current user is an admin
                if (user.role !== 'admin') {
                    console.log("DEBUG SendEncouragement: Current user is NOT admin, applying team filter.");
                    filteredRecipients = filteredRecipients.filter(profile => {
                        const recipientTeamIds = profile.teamIds || [];
                        // Check if sender and recipient share at least one common team
                        return currentUserTeamIds.some(teamId => recipientTeamIds.includes(teamId));
                    });
                } else {
                    console.log("DEBUG SendEncouragement: Current user IS admin, no team filter applied.");
                }

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
    }, [isAuthReady, user?.uid, user?.role, user?.teamIds, selectedRecipientId]); // Depend on auth ready, user UID, role, and teamIds

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
            <div className="w-full max-w-sm mx-auto"> {/* Removed card styling classes */}
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">Send Encouragement</h2>
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={isLoading || recipients.length === 0}
                        >
                            {recipients.length === 0 ? (
                                <option value="">
                                    {user?.role === 'admin' ? "No users available (admin)" : "No shared teams, no recipients available"}
                                </option>
                            ) : (
                                recipients.map(recipient => (
                                    <option key={recipient.id} value={recipient.id}>
                                        {recipient.displayName || recipient.email}
                                    </option>
                                ))
                            )}
                        </select>
                        {recipients.length === 0 && user?.role !== 'admin' && (
                            <p className="text-sm text-gray-500 mt-1">
                                Join a team in Settings to send notes to teammates!
                            </p>
                        )}
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y bg-white"
                            placeholder="Type your encouragement here..."
                            disabled={isLoading}
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="submit"
                            className="px-4 py-2 !bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
