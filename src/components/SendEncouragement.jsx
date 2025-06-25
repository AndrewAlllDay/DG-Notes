// src/components/SendEncouragement.jsx
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { addEncouragementNote, subscribeToAllUserDisplayNames } from '../services/firestoreService';
import { useFirebase } from '../firebase'; // To get the sender's UID
import { ChevronDown, Check } from 'lucide-react'; // Import ChevronDown and Check icons

const SendEncouragement = ({ onSendSuccess, onClose, showBackButton }) => {
    const { user, isAuthReady } = useFirebase();
    const [noteText, setNoteText] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for custom dropdown visibility
    const dropdownRef = useRef(null); // Ref for custom dropdown to detect clicks outside

    // Effect to fetch all user display names
    useEffect(() => {
        let unsubscribe;
        if (isAuthReady && user) {
            console.log("DEBUG SendEncouragement: Subscribing to all user display names.");
            unsubscribe = subscribeToAllUserDisplayNames((fetchedProfiles) => {
                const currentUserId = user?.uid;
                const currentUserTeamIds = user?.teamIds || [];

                let filteredRecipients = fetchedProfiles.filter(profile => profile.id !== currentUserId);

                if (user.role !== 'admin') {
                    console.log("DEBUG SendEncouragement: Current user is NOT admin, applying team filter.");
                    filteredRecipients = filteredRecipients.filter(profile => {
                        const recipientTeamIds = profile.teamIds || [];
                        return currentUserTeamIds.some(teamId => recipientTeamIds.includes(teamId));
                    });
                } else {
                    console.log("DEBUG SendEncouragement: Current user IS admin, no team filter applied.");
                }

                setRecipients(filteredRecipients);
                // Set default selected recipient if none is selected or if previously selected one is no longer in list
                if (filteredRecipients.length > 0 && (!selectedRecipientId || !filteredRecipients.some(r => r.id === selectedRecipientId))) {
                    setSelectedRecipientId(filteredRecipients[0].id);
                } else if (filteredRecipients.length === 0) {
                    setSelectedRecipientId('');
                }
            });
        } else if (!user) {
            setRecipients([]);
            setSelectedRecipientId('');
        }

        return () => {
            if (unsubscribe) {
                console.log("DEBUG SendEncouragement: Unsubscribing from all user display names.");
                unsubscribe();
            }
        };
    }, [isAuthReady, user?.uid, user?.role, user?.teamIds, selectedRecipientId]);

    // Effect to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Effect to clear messages after a delay
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

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
            const recipientDisplayName = recipients.find(r => r.id === selectedRecipientId)?.displayName || selectedRecipientId;
            const senderDisplayName = user.displayName || user.email || 'Anonymous Sender';

            await addEncouragementNote(user.uid, selectedRecipientId, senderDisplayName, recipientDisplayName, noteText.trim());
            onSendSuccess(`Note sent to ${recipientDisplayName}!`);
            setNoteText('');
            setSelectedRecipientId(recipients.length > 0 ? recipients[0].id : '');
        } catch (error) {
            console.error("Error sending note:", error);
            setMessage({ type: 'error', text: `Failed to send note: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const getSelectedRecipientName = () => {
        const selected = recipients.find(r => r.id === selectedRecipientId);
        return selected ? (selected.displayName || selected.email) : "Select a recipient";
    };

    const handleSelectRecipient = (recipientId) => {
        setSelectedRecipientId(recipientId);
        setIsDropdownOpen(false); // Close dropdown after selection
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-5 body-pad">
            <div className="w-full max-w-sm mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">Send Encouragement</h2>
                {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="recipient-select-button" className="block text-sm font-medium text-gray-700 mb-1">
                            Send to:
                        </label>
                        {/* Custom dropdown implementation */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button" // Important: Prevents form submission
                                id="recipient-select-button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 !bg-white flex justify-between items-center text-gray-700 hover:border-gray-400 transition-colors duration-200"
                                disabled={isLoading || recipients.length === 0}
                                aria-haspopup="listbox"
                                aria-expanded={isDropdownOpen}
                            >
                                <span className="truncate">{getSelectedRecipientName()}</span>
                                <ChevronDown size={20} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                            </button>

                            {isDropdownOpen && (recipients.length > 0 ? (
                                <ul
                                    role="listbox"
                                    aria-labelledby="recipient-select-button"
                                    className="absolute z-10 w-full !bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto"
                                >
                                    {recipients.map(recipient => (
                                        <li
                                            key={recipient.id}
                                            role="option"
                                            aria-selected={recipient.id === selectedRecipientId}
                                            onClick={() => handleSelectRecipient(recipient.id)}
                                            className={`p-3 cursor-pointer hover:bg-blue-50 flex justify-between items-center ${recipient.id === selectedRecipientId ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-900'
                                                }`}
                                        >
                                            <span className="truncate">{recipient.displayName || recipient.email}</span>
                                            {recipient.id === selectedRecipientId && <Check size={18} className="text-blue-700" />}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 p-3 text-gray-500">
                                    {user?.role === 'admin' ? "No users available (admin)" : "No shared teams, no recipients available"}
                                </div>
                            ))}
                        </div>
                        {recipients.length === 0 && user?.role !== 'admin' && !isDropdownOpen && ( // Only show message if dropdown is closed
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y !bg-white"
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
