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
  const { user, isAuthReady } = useFirebase(); // user now includes role

  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [isSendEncouragementModalOpen, setIsSendEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses');

  // State for in-app notifications
  const [unreadNotes, setUnreadNotes] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  // In-app message system (reusing from LoginPage, can be a shared component later)
  const [appMessage, setAppMessage] = useState({ type: '', text: '' });
  const showAppMessage = (type, text) => {
    setAppMessage({ type, text });
    setTimeout(() => {
      setAppMessage({ type: '', text: '' });
    }, 5000);
  };

  // DEBUGGING: Log current user and auth readiness on every render
  console.log("DEBUG App.jsx Render: Current user:", user);
  console.log("DEBUG App.jsx Render: isAuthReady:", isAuthReady);


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
  }, [user?.uid, isAuthReady]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    console.log("DEBUG App.jsx: handleSignOut triggered."); // New log
    if (auth) {
      try {
        await auth.signOut();
        console.log("DEBUG: User signed out successfully.");
        // We no longer set currentPage here, as the App component's conditional render
        // based on `user` state should handle redirecting to LoginPage.
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
    showAppMessage('success', message);
    setIsSendEncouragementModalOpen(false);
  };

  const handleNotificationRead = async (noteId) => {
    if (user?.uid && noteId) {
      try {
        console.log(`DEBUG App.jsx: Marking note ${noteId} as read for user ${user.uid}`);
        await markEncouragementNoteAsRead(noteId, user.uid);
        setCurrentNotification(null);
      } catch (error) {
        console.error("DEBUG App.jsx: Error marking note as read:", error);
        showAppMessage('error', 'Failed to mark note as read.');
      }
    } else {
      console.warn("DEBUG App.jsx: Cannot mark note as read: user.uid or noteId missing.");
    }
  };

  // Define who can send encouragement notes based on role
  // For example, only 'admin' can send notes
  const canSendEncouragement = user?.role === 'admin';
  // Or if all users can send: const canSendEncouragement = !!user;

  if (!isAuthReady) {
    console.log("DEBUG App.jsx Render: isAuthReady is false, showing loading screen.");
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
        Loading application...
      </div>
    );
  }

  if (!user) {
    console.log("DEBUG App.jsx Render: User is null, showing LoginPage.");
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <LoginPage />
      </div>
    );
  }

  console.log("DEBUG App.jsx Render: User is present, showing main app content.");
  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
        onSignOut={handleSignOut}
        user={user} // Pass the full user object including role
        onOpenSendEncouragement={() => setIsSendEncouragementModalOpen(true)}
        canSendEncouragement={canSendEncouragement} // Pass permission flag
      />

      {appMessage.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-lg shadow-lg text-white
            ${appMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {appMessage.text}
        </div>
      )}

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

      {/* Conditionally render SendEncouragementModal based on canSendEncouragement */}
      {canSendEncouragement && (
        <SendEncouragementModal
          isOpen={isSendEncouragementModalOpen}
          onClose={() => setIsSendEncouragementModalOpen(false)}
          onSendSuccess={handleSendNoteSuccess}
        />
      )}
    </div>
  );
}

export default App;
