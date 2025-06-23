// src/components/SendEncouragementModal.jsx
import React, { useState } from 'react';
import { addEncouragementNote } from '../services/firestoreService';
import { useFirebase } from '../firebase'; // To get the current user's ID and Display Name
import { X } from 'lucide-react'; // Import the X icon

const SendEncouragementModal = ({ isOpen, onClose, onSendSuccess }) => {
    const { user, userId } = useFirebase(); // Get current authenticated user's ID and full user object

    const [receiverId, setReceiverId] = useState('');
    const [noteText, setNoteText] = useState('');
    const [sendingError, setSendingError] = useState(null);
    const [sendingMessage, setSendingMessage] = useState('');

    // Clear state when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setReceiverId('');
            setNoteText('');
            setSendingError(null);
            setSendingMessage('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSendingError(null); // Clear previous errors
        setSendingMessage(''); // Clear previous messages

        if (!receiverId.trim() || !noteText.trim()) {
            setSendingError("Please enter both recipient's ID and an encouragement message.");
            return;
        }

        if (!userId) {
            setSendingError("You must be logged in to send notes.");
            return;
        }

        if (userId === receiverId.trim()) {
            setSendingError("You cannot send an encouragement note to yourself.");
            return;
        }

        setSendingMessage("Sending note...");
        try {
            // Get sender's display name from the user object
            const senderDisplayName = user?.displayName || 'Anonymous User';

            // Pass senderDisplayName to the addEncouragementNote function
            await addEncouragementNote(userId, receiverId.trim(), senderDisplayName, '', noteText.trim()); // Receiver display name is optional for now
            setSendingMessage("Note sent successfully!");
            if (onSendSuccess) {
                onSendSuccess(`Note sent to ${receiverId.trim()}`); // Callback for success notification in App.jsx
            }
            setTimeout(onClose, 1500); // Close modal after a short delay on success
        } catch (error) {
            console.error("Error sending encouragement note:", error);
            setSendingError(`Failed to send note: ${error.message}`);
            setSendingMessage(""); // Clear sending message on error
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md relative">
                <h2 className="text-2xl font-bold mb-4 text-center">Send Encouragement</h2>
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={24} />
                </button>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="receiverId" className="block text-sm font-medium text-gray-700 mb-1">Recipient User ID:</label>
                        <input
                            type="text"
                            id="receiverId"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={receiverId}
                            onChange={(e) => setReceiverId(e.target.value)}
                            placeholder="Enter recipient's User ID"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="noteText" className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
                        <textarea
                            id="noteText"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                            rows="4"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Write your encouraging message here..."
                            required
                        ></textarea>
                    </div>

                    {sendingError && (
                        <p className="text-red-600 text-sm">{sendingError}</p>
                    )}
                    {sendingMessage && (
                        <p className="text-green-600 text-sm">{sendingMessage}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                        Send Note
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SendEncouragementModal;
