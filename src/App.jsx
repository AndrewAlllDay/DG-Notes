// src/App.jsx

import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import LoginPage from './components/LoginPage';
import NotificationToast from './components/NotificationToast';

import './styles/EncouragementModal.css';

import { useFirebase, auth } from './firebase';
import { subscribeToEncouragementNotes, markEncouragementNoteAsRead, subscribeToAllUserDisplayNames } from './services/firestoreService';

import * as Dialog from '@radix-ui/react-dialog';

const LazySettingsPage = lazy(() => import('./components/SettingsPage'));
const LazySendEncouragement = lazy(() => import('./components/SendEncouragement'));
const LazyWeatherDisplay = lazy(() => import('./components/WeatherDisplay'));

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
  const handleLoginSuccess = (uid) => {
    console.log("DEBUG App.jsx: handleLoginSuccess triggered for UID:", uid);
    showAppMessage('success', 'You have been successfully logged in!');
  };

  const handleLogoutSuccess = () => {
    console.log("DEBUG App.jsx: handleLogoutSuccess triggered.");
    showAppMessage('success', 'You have been signed out.');
  };

  const { user, isAuthReady, userId: currentUserId } = useFirebase(handleLoginSuccess, handleLogoutSuccess);

  console.log(`DEBUG App.jsx Render: user=${user?.uid || 'null'}, isAuthReady=${isAuthReady}`);

  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses');
  // NEW STATE: Key for the Courses component to force remount
  const [coursesKey, setCoursesKey] = useState(0);

  const [unreadNotesFromFirestore, setUnreadNotesFromFirestore] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [allPublicUserProfiles, setAllPublicUserProfiles] = useState([]);

  const [hasInitialNonPlayerRedirected, setHasInitialNonPlayerRedirected] = useState(false);

  const [showReloadPrompt, setShowReloadPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);


  const [appMessage, setAppMessage] = useState({ type: '', text: '' });
  const showAppMessage = (type, text) => {
    setAppMessage({ type, text });
    setTimeout(() => {
      setAppMessage({ type: '', text: '' });
    }, 5000);
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let registration;

      const registerServiceWorker = async () => {
        try {
          registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker: Registration successful with scope:', registration.scope);

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowReloadPrompt(true);
                  console.log('Service Worker: New content available, showing reload prompt.');
                }
              });
            }
          });

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker: New service worker active, reloading page...');
            window.location.reload();
          });

        } catch (error) {
          console.error('Service Worker: Registration failed:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

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

  useEffect(() => {
    let unsubscribeNotes;
    console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Checking user and authReady status for raw note subscription.");
    if (user?.uid && isAuthReady) {
      console.log(`DEBUG App.jsx useEffect [user, isAuthReady]: Subscribing to raw unread notes for receiverId: ${user.uid}`);
      unsubscribeNotes = subscribeToEncouragementNotes(user.uid, (notes) => {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Received raw notes from subscribeToEncouragementNotes callback:", notes);
        setUnreadNotesFromFirestore(notes);
      });
    } else {
      console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Conditions not met for raw note subscription (user.uid or isAuthReady false).");
      setUnreadNotesFromFirestore([]);
    }

    return () => {
      if (unsubscribeNotes) {
        console.log("DEBUG App.jsx useEffect [user, isAuthReady]: Unsubscribing from raw notes listener.");
        unsubscribeNotes();
      }
    };
  }, [user?.uid, isAuthReady]);

  useEffect(() => {
    console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Processing notes for notification.");
    console.log(`DEBUG App.jsx: unreadNotesFromFirestore.length=${unreadNotesFromFirestore.length}, allPublicUserProfiles.length=${allPublicUserProfiles.length}`);

    if (unreadNotesFromFirestore.length > 0 && allPublicUserProfiles.length > 0) {
      const firstUnreadNote = unreadNotesFromFirestore[0];
      const senderProfile = allPublicUserProfiles.find(profile => profile.id === firstUnreadNote.senderId);
      const senderDisplayName = senderProfile?.displayName || 'Unknown Sender';

      const noteWithSenderName = {
        ...firstUnreadNote,
        senderDisplayName: senderDisplayName,
      };
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Setting currentNotification to:", noteWithSenderName);
      setCurrentNotification(noteWithSenderName);
    } else if (unreadNotesFromFirestore.length > 0 && allPublicUserProfiles.length === 0) {
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: Notes available but public profiles not yet loaded. Waiting for profiles to populate before setting notification.");
      setCurrentNotification(null);
    } else {
      console.log("DEBUG App.jsx useEffect [unreadNotesFromFirestore, allPublicUserProfiles]: No unread notes or profiles not loaded, clearing currentNotification.");
      setCurrentNotification(null);
    }
  }, [unreadNotesFromFirestore, allPublicUserProfiles]);


  useEffect(() => {
    if (isAuthReady && user && user.role === 'non-player' && !hasInitialNonPlayerRedirected) {
      console.log("DEBUG App.jsx: Detected non-player user. Redirecting to Send Note page.");
      setCurrentPage('send-note');
      setHasInitialNonPlayerRedirected(true);
    }
    if (!user) {
      setHasInitialNonPlayerRedirected(false);
    }
  }, [user, isAuthReady, hasInitialNonPlayerRedirected]);

  // MODIFIED handleNavigate to reset Courses component
  const handleNavigate = (page) => {
    setCurrentPage(page);
    // If navigating to 'courses', increment the key to force Courses component to remount
    if (page === 'courses') {
      setCoursesKey(prevKey => prevKey + 1);
    }
  };

  const handleSignOut = async () => {
    console.log("DEBUG App.jsx handleSignOut: Function called.");
    if (auth) {
      try {
        await auth.signOut();
        console.log("DEBUG App.jsx handleSignOut: User signed out successfully (Firebase event triggered).");
        setCurrentPage('courses');
        setUnreadNotesFromFirestore([]);
        setCurrentNotification(null);
        setAllPublicUserProfiles([]);
        setHasInitialNonPlayerRedirected(false);
      } catch (error) {
        console.error("DEBUG App.jsx handleSignOut: Error signing out:", error);
        showAppMessage('error', `Failed to sign out: ${error.message}`);
      }
    }
  };

  const handleSendNoteSuccess = (message) => {
    showAppMessage('success', message);
    setCurrentPage('courses');
  };

  const handleNotificationRead = async (noteId) => {
    if (user?.uid && noteId) {
      try {
        console.log(`DEBUG App.jsx: Marking note ${noteId} as read for user ${user.uid}`);
        await markEncouragementNoteAsRead(noteId, user.uid);
      } catch (error) {
        console.error("DEBUG App.jsx: Error marking note as read:", error);
        showAppMessage('error', 'Failed to mark note as read.');
      }
    } else {
      console.warn("DEBUG App.jsx: Cannot mark note as read: user.uid or noteId missing.");
    }
  };

  const canSendEncouragement = !!user;

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <LoginPage />
      </div>
    );
  }

  const showSendNoteBackButton = user.role !== 'non-player';

  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
        onSignOut={handleSignOut}
        user={user}
        onOpenSendEncouragement={() => handleNavigate('send-note')}
        canSendEncouragement={canSendEncouragement}
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
        {/* Conditional rendering for different pages */}
        {currentPage === 'courses' && (
          <Courses
            key={coursesKey} // <-- NEW: Key prop added here
            setIsEncouragementModalOpen={setIsEncouragementModalOpen}
          />
        )}
        {currentPage === 'settings' && (
          <Suspense fallback={<div>Loading Settings...</div>}>
            <LazySettingsPage />
          </Suspense>
        )}
        {currentPage === 'send-note' && (
          <Suspense fallback={<div>Loading Send Note page...</div>}>
            <LazySendEncouragement
              onSendSuccess={handleSendNoteSuccess}
              onClose={() => handleNavigate('courses')}
              showBackButton={showSendNoteBackButton}
            />
          </Suspense>
        )}
        {currentPage === 'weather' && (
          <Suspense fallback={<div>Loading Weather...</div>}>
            <LazyWeatherDisplay />
          </Suspense>
        )}
      </main>

      <EncouragementModal
        isOpen={isEncouragementModalOpen}
        onClose={() => setIsEncouragementModalOpen(false)}
      />

      <Dialog.Root open={showReloadPrompt} onOpenChange={setShowReloadPrompt}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="text-center">
              <Dialog.Title className="text-xl font-bold mb-4 text-gray-800">App Update Available!</Dialog.Title>
              <Dialog.Description className="mb-6 text-gray-700">A new version of the app is ready. Please refresh to get the latest features and bug fixes.</Dialog.Description>
              <button
                onClick={updateApp}
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors duration-200"
              >
                Refresh to Update
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default App;