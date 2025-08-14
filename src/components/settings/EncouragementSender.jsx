import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { addEncouragementNote } from '../../services/firestoreService';

const EncouragementSender = React.memo(({ user, allUserProfiles }) => {
    const [noteText, setNoteText] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipientId, setSelectedRecipientId] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSending, setIsSending] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (allUserProfiles && user) {
            const currentUserTeamIds = user.teamIds || [];
            let filtered = allUserProfiles.filter(p => p.id !== user.uid);

            if (user.role !== 'admin') {
                filtered = filtered.filter(p => (p.teamIds || []).some(tid => currentUserTeamIds.includes(tid)));
            }
            setRecipients(filtered);

            if (filtered.length > 0 && !filtered.some(r => r.id === selectedRecipientId)) {
                setSelectedRecipientId(filtered[0].id);
            } else if (filtered.length === 0) {
                setSelectedRecipientId('');
            }
        }
    }, [allUserProfiles, user, selectedRecipientId]);

    // ✨ This useEffect hook was corrected.
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedRecipientId || !noteText.trim()) return;

        setIsSending(true);
        try {
            const recipient = recipients.find(r => r.id === selectedRecipientId);
            await addEncouragementNote(user.uid, selectedRecipientId, user.displayName, recipient.displayName, noteText.trim());
            setMessage({ type: 'success', text: `Note sent to ${recipient.displayName}!` });
            setNoteText('');
        } catch (error) {
            setMessage({ type: 'error', text: `Failed to send note: ${error.message}` });
        } finally {
            setIsSending(false);
        }
    }, [noteText, selectedRecipientId, user, recipients]);

    const getSelectedRecipientName = useCallback(() => {
        if (!selectedRecipientId) return "Select a recipient";
        const selected = recipients.find(r => r.id === selectedRecipientId);
        return selected ? (selected.displayName || selected.email) : "Select a recipient";
    }, [selectedRecipientId, recipients]);

    const handleSelectRecipient = useCallback((recipientId) => {
        setSelectedRecipientId(recipientId);
        setIsDropdownOpen(false);
    }, []);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message.text && (
                <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}
            <div>
                <label htmlFor="recipient-select-button" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send to:</label>
                <div className="relative" ref={dropdownRef}>
                    <button type="button" id="recipient-select-button" onClick={() => setIsDropdownOpen(prev => !prev)} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 !bg-white dark:bg-gray-700 flex justify-between items-center text-gray-700 dark:text-gray-200 hover:border-gray-400" disabled={isSending || recipients.length === 0}>
                        <span className="truncate">{getSelectedRecipientName()}</span>
                        <ChevronDown size={20} className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    {isDropdownOpen && (
                        <ul className="absolute z-10 w-full !bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                            {recipients.length > 0 ? recipients.map(recipient => (
                                <li key={recipient.id} onClick={() => handleSelectRecipient(recipient.id)} className={`p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 flex justify-between items-center ${recipient.id === selectedRecipientId ? 'bg-blue-100 dark:bg-blue-800 font-semibold text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-gray-200'}`}>
                                    <span className="truncate">{recipient.displayName || recipient.email}</span>
                                    {recipient.id === selectedRecipientId && <Check size={18} />}
                                </li>
                            )) : (
                                <li className="p-3 text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? "No other users available" : "No teammates found"}</li>
                            )}
                        </ul>
                    )}
                </div>
            </div>
            <div>
                <label htmlFor="note-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Message:</label>
                <textarea id="note-text" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows="4" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y !bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Type your encouragement here..." disabled={isSending}></textarea>
            </div>
            <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 !bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50" disabled={isSending || !selectedRecipientId || !noteText.trim()}>
                    {isSending ? 'Sending...' : 'Send Note'}
                </button>
            </div>
        </form>
    );
});

export default EncouragementSender;