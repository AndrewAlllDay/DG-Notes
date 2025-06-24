import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import SendEncouragementModal from './components/SendEncouragementModal';
import NotificationToast from './components/NotificationToast'; // Uncommented import

import './styles/EncouragementModal.css';

// Import useFirebase and the auth instance directly from firebase.js
import { useFirebase, auth } from './firebase';
import { subscribeToEncouragementNotes, markEncouragementNoteAsRead, subscribeToAllUserDisplayNames } from './services/firestoreService';

function App() {
  // Define callbacks for login/logout success messages
  const handleLoginSuccess = (uid) => {
    console.log("DEBUG App.jsx: handleLoginSuccess triggered for UID:", uid);
    showAppMessage('success', 'You have been successfully logged in!');
  };

  const handleLogoutSuccess = () => {
    console.log("DEBUG App.jsx: handleLogoutSuccess triggered.");
    showAppMessage('success', 'You have been signed out.');
  };

  // Pass these callbacks to useFirebase
  const { user, isAuthReady, userId: currentUserId } = useFirebase(handleLoginSuccess, handleLogoutSuccess);

  console.log(`DEBUG App.jsx Render: user=${user?.uid || 'null'}, isAuthReady=${isAuthReady}`);

  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [isSendEncouragementModalOpen, setIsSendEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses');

  // State for in-app notifications
  const [unreadNotes, setUnreadNotes] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null); // The note currently displayed as a toast
  const [allPublicUserProfiles, setAllPublicUserProfiles] = useState([]); // State for all public user profiles

  // In-app message system (reused from LoginPage, can be a shared component later)
  const [appMessage, setAppMessage] = useState({ type: '', text: '' });
  const showAppMessage = (type, text) => {
    setAppMessage({ type, text });
    setTimeout(() => {
      setAppMessage({ type: '', text: '' });
    }, 5000);
  };

  // Effect to subscribe to all public user display names
  useEffect(() => {
    let unsubscribePublicProfiles;
    if (isAuthReady) {
      console.log("DEBUG App.jsx useEffect [isAuthReady]: Subscribing to all public user display names.");
      unsubscribePublicProfiles = subscribeToAllUserDisplayNames((profiles) => {
        setAllPublicUserProfiles(profiles);
      });
    }

    return () => {
      if (unsubscribePublicProfiles) {
        console.log("DEBUG App.jsx useEffect [isAuthReady]: Unsubscribing from all public user display names.");
        unsubscribePublicProfiles();
      }
    };
  }, [isAuthReady]);

  // Effect for subscribing to notes and updating notifications
  useEffect(() => {
    let unsubscribeNotes;
    console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Checking user and authReady status for note subscription.");
    console.log(`DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: User UID=${user?.uid || 'null'}, isAuthReady=${isAuthReady}, allPublicUserProfiles.length=${allPublicUserProfiles.length}`);

    if (user?.uid && isAuthReady) {
      console.log(`DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Subscribing to unread notes for receiverId: ${user.uid}`);
      unsubscribeNotes = subscribeToEncouragementNotes(user.uid, (notes) => {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Received notes from subscribeToEncouragementNotes callback:", notes);
        const notesWithSenderNames = notes.map((note) => {
          const senderProfile = allPublicUserProfiles.find(profile => profile.id === note.senderId);
          return {
            ...note,
            senderDisplayName: senderProfile?.displayName || 'Someone',
          };
        });
        setUnreadNotes(notesWithSenderNames);
        if (notesWithSenderNames.length > 0) {
          console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Setting currentNotification to:", notesWithSenderNames[0]);
          setCurrentNotification(notesWithSenderNames[0]);
        } else {
          console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: No unread notes, clearing currentNotification.");
          setCurrentNotification(null);
        }
      });
    } else {
      console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Conditions not met for note subscription (user.uid or isAuthReady false).");
    }

    return () => {
      if (unsubscribeNotes) {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady, allPublicUserProfiles]: Unsubscribing from notes listener.");
        unsubscribeNotes();
      }
    };
  }, [user?.uid, isAuthReady, allPublicUserProfiles]); // Add allPublicUserProfiles to dependencies

  // Removed the useEffect for previousUserRef as notifications are now event-driven from useFirebase

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    console.log("DEBUG App.jsx handleSignOut: Function called.");
    if (auth) {
      try {
        await auth.signOut();
        console.log("DEBUG App.jsx handleSignOut: User signed out successfully (Firebase event triggered).");
        setCurrentPage('courses');
        setUnreadNotes([]); // Clear notes on logout
        setCurrentNotification(null); // Clear notification on logout
        setAllPublicUserProfiles([]); // Clear public profiles on logout
        // The success message ('You have been signed out') is now handled by the onLogoutSuccess callback from useFirebase
      } catch (error) {
        console.error("DEBUG App.jsx handleSignOut: Error signing out:", error);
        showAppMessage('error', `Failed to sign out: ${error.message}`);
      }
    } else {
      console.error("DEBUG App.jsx handleSignOut: Firebase Auth instance is not available for signOut.");
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
