// src/components/NotificationToast.jsx
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const NotificationToast = ({ note, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show the toast when the note prop changes (a new notification arrives)
        if (note) {
            setIsVisible(true);
            // Automatically hide after 5 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
                // Optionally call onClose here if you want it to disappear and mark as read automatically
                // However, the `App.jsx` handles this based on `currentNotification` state change.
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false); // Hide if no note is passed
        }
    }, [note]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose(); // Call the parent's onClose handler (e.g., handleNotificationRead in App.jsx)
        }
    };

    if (!isVisible || !note) return null;

    return (
        <div className="fixed top-4 right-4 z-[1001] bg-blue-600 text-white p-4 rounded-lg shadow-xl flex items-start space-x-3 max-w-xs transition-transform duration-300 ease-out transform translate-x-0 opacity-100">
            <div className="flex-grow">
                <p className="font-semibold text-lg mb-1">New Encouragement!</p>
                <p className="text-sm">From: {note.senderId}</p>
                <p className="text-sm mt-1">{note.noteText}</p>
            </div>
            <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 focus:outline-none p-1 -mt-1 -mr-1 rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Dismiss notification"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default NotificationToast;
