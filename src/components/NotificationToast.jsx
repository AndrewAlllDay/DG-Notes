// src/components/NotificationToast.jsx
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const NotificationToast = ({ note, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show the toast when the note prop changes (a new notification arrives)
        // Removed the setTimeout here, so it will not auto-hide
        if (note) {
            setIsVisible(true);
        } else {
            setIsVisible(false); // Hide if no note is passed (e.g., after being marked as read by parent)
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
        <div className="fixed top-4 left-0 right-0 z-[1001] bg-blue-600 text-white py-6 px-4 rounded-lg shadow-xl flex items-start space-x-3 w-full transition-transform duration-300 ease-out transform opacity-100">
            {/* The 'left-0 right-0' and 'w-full' classes ensure it spans 100% width. */}
            {/* 'py-6 px-4' provides more vertical padding and horizontal padding. */}
            <div className="flex-grow">
                <p className="font-semibold text-lg mb-1">New Encouragement!</p>
                {/* Display sender's display name, defaulting to "Someone" if not available */}
                <p className="text-sm">From: {note.senderDisplayName || 'Someone'}</p>
                <p className="text-sm mt-1">{note.noteText}</p>
            </div>
            <button
                onClick={handleClose}
                className="text-black hover:text-gray-200 focus:outline-none p-1 -mt-1 -mr-1 rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Dismiss notification"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default NotificationToast;
