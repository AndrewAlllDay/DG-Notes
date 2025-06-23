import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import SendEncouragementModal from './components/SendEncouragementModal';
import NotificationToast from './components/NotificationToast';

import './styles/EncouragementModal.css';

// Import useFirebase and the auth instance directly from firebase.js
import { useFirebase, auth } from './firebase';
import { subscribeToEncouragementNotes, markEncouragementNoteAsRead } from './services/firestoreService';

function App() {
  const { user, isAuthReady, userId: currentUserId } = useFirebase(); // Renamed userId to currentUserId for clarity here

  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [isSendEncouragementModalOpen, setIsSendEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses');

  // State for in-app notifications
  const [unreadNotes, setUnreadNotes] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null); // The note currently displayed as a toast

  // In-app message system (reusing from LoginPage, can be a shared component later)
  const [appMessage, setAppMessage] = useState({ type: '', text: '' });
  const showAppMessage = (type, text) => {
    setAppMessage({ type, text });
    setTimeout(() => {
      setAppMessage({ type: '', text: '' });
    }, 5000);
  };

  useEffect(() => {
    let unsubscribeNotes;
    console.log("DEBUG App.jsx useEffect: Checking user and authReady status for note subscription.");
    console.log("DEBUG App.jsx useEffect: User UID:", user?.uid, "isAuthReady:", isAuthReady);

    if (user?.uid && isAuthReady) {
      console.log(`DEBUG App.jsx useEffect: Subscribing to unread notes for receiverId: ${user.uid}`);
      unsubscribeNotes = subscribeToEncouragementNotes(user.uid, (notes) => {
        console.log("DEBUG App.jsx useEffect: received notes from subscribeToEncouragementNotes callback:", notes);
        setUnreadNotes(notes);
        if (notes.length > 0) {
          console.log("DEBUG App.jsx useEffect: Setting currentNotification to:", notes[0]);
          setCurrentNotification(notes[0]);
        } else {
          console.log("DEBUG App.jsx useEffect: No unread notes, clearing currentNotification.");
          setCurrentNotification(null);
        }
      });
    } else {
      console.log("DEBUG App.jsx useEffect: Conditions not met for note subscription (user.uid or isAuthReady false).");
    }

    return () => {
      if (unsubscribeNotes) {
        console.log("DEBUG App.jsx useEffect: Unsubscribing from notes listener.");
        unsubscribeNotes();
      }
    };
  }, [user?.uid, isAuthReady]); // Re-subscribe when user changes or auth readiness changes

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    if (auth) {
      try {
        await auth.signOut();
        console.log("DEBUG: User signed out successfully.");
        setCurrentPage('courses');
        setUnreadNotes([]); // Clear notes on logout
        setCurrentNotification(null); // Clear notification on logout
        showAppMessage('success', 'You have been signed out.');
      } catch (error) {
        console.error("DEBUG: Error signing out:", error);
        showAppMessage('error', `Failed to sign out: ${error.message}`);
      }
    } else {
      console.error("DEBUG: Firebase Auth instance is not available for signOut.");
      showAppMessage('error', 'Logout failed: Authentication service not ready.');
    }
  };

  const handleSendNoteSuccess = (message) => {
    showAppMessage('success', message); // Display success message from modal
    setIsSendEncouragementModalOpen(false); // Close the modal
  };

  // Function to mark a notification as read and hide it
  const handleNotificationRead = async (noteId) => {
    if (user?.uid && noteId) {
      try {
        console.log(`DEBUG App.jsx: Marking note ${noteId} as read for user ${user.uid}`);
        await markEncouragementNoteAsRead(noteId, user.uid);
        setCurrentNotification(null); // Hide the current toast
        // The `subscribeToEncouragementNotes` will automatically refresh unreadNotes
      } catch (error) {
        console.error("DEBUG App.jsx: Error marking note as read:", error);
        showAppMessage('error', 'Failed to mark note as read.');
      }
    } else {
      console.warn("DEBUG App.jsx: Cannot mark note as read: user.uid or noteId missing.");
    }
  };

  // Define who can send encouragement notes. For now, any logged-in user.
  const canSendEncouragement = !!user;

  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
        Loading application...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <LoginPage />
      </div>
    );
  }

  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
        onSignOut={handleSignOut}
        user={user}
        onOpenSendEncouragement={() => setIsSendEncouragementModalOpen(true)}
        canSendEncouragement={canSendEncouragement}
      />

      {/* In-app message display, positioned globally */}
      {appMessage.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-lg shadow-lg text-white
            ${appMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {appMessage.text}
        </div>
      )}

      {/* Notification Toast */}
      {currentNotification && (
        <NotificationToast
          note={currentNotification}
          onClose={() => handleNotificationRead(currentNotification.id)}
        />
      )}

      <main className="flex-grow">
        {currentPage === 'courses' && <Courses />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>

      <EncouragementModal
        isOpen={isEncouragementModalOpen}
        onClose={() => setIsEncouragementModalOpen(false)}
      />

      <SendEncouragementModal
        isOpen={isSendEncouragementModalOpen}
        onClose={() => setIsSendEncouragementModalOpen(false)}
        onSendSuccess={handleSendNoteSuccess}
      />
    </div>
  );
}

export default App;
