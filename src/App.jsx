import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import SendEncouragement from './components/SendEncouragement';
import NotificationToast from './components/NotificationToast';

import './styles/EncouragementModal.css'; // Assuming this is still used for general styles

import { useFirebase, auth } from './firebase';
import { subscribeToEncouragementNotes, markEncouragementNoteAsRead, subscribeToAllUserDisplayNames } from './services/firestoreService';

// LoadingScreen Component (as it was before the last update)
const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-[2000]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700 font-semibold">Loading DG Notes...</p>
      </div>
    </div>
  );
};


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
  const [currentPage, setCurrentPage] = useState('courses');

  // State for in-app notifications
  const [unreadNotesFromFirestore, setUnreadNotesFromFirestore] = useState([]); // Raw notes from Firestore
  const [currentNotification, setCurrentNotification] = useState(null); // The note currently displayed as a toast
  const [allPublicUserProfiles, setAllPublicUserProfiles] = useState([]); // State for all public user profiles

  // State to track if the non-player's initial redirection has happened
  const [hasInitialNonPlayerRedirected, setHasInitialNonPlayerRedirected] = useState(false);


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
        console.log("DEBUG App.jsx: Fetched public user profiles:", profiles);
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

  // Effect for subscribing to raw unread notes from Firestore
  useEffect(() => {
    let unsubscribeNotes;
    console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Checking user and authReady status for raw note subscription.");
    if (user?.uid && isAuthReady) {
      console.log(`DEBUG App.jsx useEffect [user, isAuthReady]: Subscribing to raw unread notes for receiverId: ${user.uid}`);
      unsubscribeNotes = subscribeToEncouragementNotes(user.uid, (notes) => {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Received raw notes from subscribeToEncouragementNotes callback:", notes);
        setUnreadNotesFromFirestore(notes); // Store raw notes
      });
    } else {
      console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Conditions not met for raw note subscription (user.uid or isAuthReady false).");
      setUnreadNotesFromFirestore([]); // Clear raw notes on logout or not ready
    }

    return () => {
      if (unsubscribeNotes) {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Unsubscribing from raw notes listener.");
        unsubscribeNotes();
      }
    };
  }, [user?.uid, isAuthReady]);


  // NEW Effect to process unread notes with sender display names
  // This effect now explicitly waits for both raw notes and public profiles to be ready
  useEffect(() => {
    console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Processing notes for notification.");
    console.log(`DEBUG App.jsx: unreadNotesFromFirestore.length=${unreadNotesFromFirestore.length}, allPublicUserProfiles.length=${allPublicUserProfiles.length}`);

    if (unreadNotesFromFirestore.length > 0 && allPublicUserProfiles.length > 0) {
      const firstUnreadNote = unreadNotesFromFirestore[0];
      const senderProfile = allPublicUserProfiles.find(profile => profile.id === firstUnreadNote.senderId);
      const senderDisplayName = senderProfile?.displayName || 'Unknown Sender'; // Fallback for safety

      const noteWithSenderName = {
        ...firstUnreadNote,
        senderDisplayName: senderDisplayName,
      };
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Setting currentNotification to:", noteWithSenderName);
      setCurrentNotification(noteWithSenderName);
    } else if (unreadNotesFromFirestore.length > 0 && allPublicUserProfiles.length === 0) {
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Notes available but public profiles not yet loaded. Waiting for profiles to populate before setting notification.");
      setCurrentNotification(null); // Explicitly ensure no notification is shown while waiting for profiles
    } else {
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: No unread notes or profiles not loaded, clearing currentNotification.");
      setCurrentNotification(null);
    }
  }, [unreadNotesFromFirestore, allPublicUserProfiles]);


  // useEffect for initial non-player page display
  useEffect(() => {
    // Check if auth is ready, user is logged in, has 'non-player' role, and hasn't been redirected yet
    if (isAuthReady && user && user.role === 'non-player' && !hasInitialNonPlayerRedirected) {
      console.log("DEBUG App.jsx: Detected non-player user. Redirecting to Send Note page.");
      setCurrentPage('send-note'); // Set current page to 'send-note'
      setHasInitialNonPlayerRedirected(true); // Mark as redirected to prevent re-opening
    }
    // Also, if a non-player logs out, reset the redirect flag
    if (!user) {
      setHasInitialNonPlayerRedirected(false);
    }
  }, [user, isAuthReady, hasInitialNonPlayerRedirected]);


  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    console.log("DEBUG App.jsx handleSignOut: Function called.");
    if (auth) {
      try {
        await auth.signOut();
        console.log("DEBUG App.jsx handleSignOut: User signed out successfully (Firebase event triggered).");
        setCurrentPage('courses'); // Go back to courses page after sign out
        setUnreadNotesFromFirestore([]); // Clear raw notes on logout
        setCurrentNotification(null); // Clear notification on logout
        setAllPublicUserProfiles([]); // Clear public profiles on logout
        setHasInitialNonPlayerRedirected(false); // Reset for next login
        // The success message ('You have been signed out') is now handled by the onLogoutSuccess callback from useFirebase
      } catch (error) {
        console.error("DEBUG App.jsx handleSignOut: Error signing out:", error);
        showAppMessage('error', `Failed to sign out: ${error.message}`);
      }
    }
  };

  const handleSendNoteSuccess = (message) => {
    showAppMessage('success', message); // Display success message from modal
    setCurrentPage('courses'); // Navigate back to courses page after sending a note
  };

  // Function to mark a notification as read and hide it
  const handleNotificationRead = async (noteId) => {
    if (user?.uid && noteId) {
      try {
        console.log(`DEBUG App.jsx: Marking note ${noteId} as read for user ${user.uid}`);
        await markEncouragementNoteAsRead(noteId, user.uid);
        // No need to manually clear currentNotification here, the `unreadNotesFromFirestore` listener will update it
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

  // Render the LoadingScreen if authentication is not yet ready
  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  // Render the LoginPage if no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <LoginPage />
      </div>
    );
  }

  // Determine if the "Back to Courses" button should be shown
  const showSendNoteBackButton = user.role !== 'non-player';

  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)} // This was the original location for opening the modal
        onSignOut={handleSignOut}
        user={user}
        onOpenSendEncouragement={() => handleNavigate('send-note')}
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
        {/* Conditional rendering for different pages */}
        {currentPage === 'courses' && <Courses />} {/* Removed setIsEncouragementModalOpen prop */}
        {currentPage === 'settings' && <SettingsPage />}
        {/* Render SendEncouragement as a full page */}
        {currentPage === 'send-note' && (
          <SendEncouragement
            onSendSuccess={handleSendNoteSuccess}
            onClose={() => handleNavigate('courses')} // Allow closing/navigating back
            showBackButton={showSendNoteBackButton} // Pass the new prop
          />
        )}
      </main>

      <EncouragementModal
        isOpen={isEncouragementModalOpen}
        onClose={() => setIsEncouragementModalOpen(false)}
      />
    </div>
  );
}

export default App;
