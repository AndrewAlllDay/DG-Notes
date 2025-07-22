import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header.jsx';
import Courses from './components/Courses.jsx';
import EncouragementModal from './components/EncouragementModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import SplashPage from './components/SplashPage.jsx';

import './styles/EncouragementModal.css';

import { useFirebase, auth } from './firebase.js';
import { subscribeToEncouragementNotes, markEncouragementNoteAsRead, subscribeToAllUserDisplayNames } from './services/firestoreService.jsx';

import * as Dialog from '@radix-ui/react-dialog';

const LazySettingsPage = lazy(() => import('./components/SettingsPage.jsx'));
const LazySendEncouragement = lazy(() => import('./components/SendEncouragement.jsx'));
const LazyWeatherDisplay = lazy(() => import('./components/WeatherDisplay.jsx'));
const LazyInTheBagPage = lazy(() => import('./components/InTheBagPage.jsx'));
const LazyNewsFeed = lazy(() => import('./components/Newsfeed.jsx'));

const LoadingScreen = ({ isDarkMode }) => {
  const bgColor = isDarkMode ? 'bg-black' : 'bg-gray-100';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-700';
  const spinnerColor = isDarkMode ? 'border-blue-300' : 'border-blue-500';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[2000] ${bgColor}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 mx-auto mb-4 ${spinnerColor}`}></div>
        <p className={`text-xl font-semibold ${textColor}`}>Loading DG Notes...</p>
      </div>
    </div>
  );
};


function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = (uid) => {
    showAppMessage('success', 'You have been successfully logged in!');
    setIsLoginModalOpen(false);
  };

  const handleLogoutSuccess = () => {
    showAppMessage('success', 'You have been signed out.');
  };

  const { user, isAuthReady, userId: currentUserId } = useFirebase(handleLoginSuccess, handleLogoutSuccess);

  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses');
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
    }, 1500);
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // --- NEW useEffect TO HANDLE REDIRECT FROM SHARE TARGET ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('share-target')) {
      // If the user lands here from a share action,
      // automatically navigate them to the settings page.
      setCurrentPage('settings');
    }
  }, []); // Runs once when the app loads

  /* // Temporarily disable Service Worker for development
   useEffect(() => {
     if ('serviceWorker' in navigator) {
       // ... service worker code ...
     }
   }, []);
  */

  useEffect(() => {
    let unsubscribePublicProfiles;
    if (isAuthReady) {
      unsubscribePublicProfiles = subscribeToAllUserDisplayNames((profiles) => {
        setAllPublicUserProfiles(profiles);
      });
    }
    return () => {
      if (unsubscribePublicProfiles) {
        unsubscribePublicProfiles();
      }
    };
  }, [isAuthReady]);

  useEffect(() => {
    let unsubscribeNotes;
    if (user?.uid && isAuthReady) {
      unsubscribeNotes = subscribeToEncouragementNotes(user.uid, (notes) => {
        setUnreadNotesFromFirestore(notes);
      });
    } else {
      setUnreadNotesFromFirestore([]);
    }
    return () => {
      if (unsubscribeNotes) {
        unsubscribeNotes();
      }
    };
  }, [user?.uid, isAuthReady]);

  useEffect(() => {
    if (unreadNotesFromFirestore.length > 0 && allPublicUserProfiles.length > 0) {
      const firstUnreadNote = unreadNotesFromFirestore[0];
      const senderProfile = allPublicUserProfiles.find(profile => profile.id === firstUnreadNote.senderId);
      const senderDisplayName = senderProfile?.displayName || 'Unknown Sender';
      const noteWithSenderName = { ...firstUnreadNote, senderDisplayName };
      setCurrentNotification(noteWithSenderName);
    } else {
      setCurrentNotification(null);
    }
  }, [unreadNotesFromFirestore, allPublicUserProfiles]);


  useEffect(() => {
    if (isAuthReady && user && user.role === 'non-player' && !hasInitialNonPlayerRedirected) {
      setCurrentPage('send-note');
      setHasInitialNonPlayerRedirected(true);
    }
  }, [user, isAuthReady, hasInitialNonPlayerRedirected]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'courses') {
      setCoursesKey(prevKey => prevKey + 1);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      try {
        await auth.signOut();
        setCurrentPage('courses');
        setUnreadNotesFromFirestore([]);
        setCurrentNotification(null);
        setAllPublicUserProfiles([]);
        setHasInitialNonPlayerRedirected(false);
      } catch (error) {
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
        await markEncouragementNoteAsRead(noteId, user.uid);
      } catch (error) {
        showAppMessage('error', 'Failed to mark note as read.');
      }
    }
  };

  const canSendEncouragement = !!user;

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowReloadPrompt(false);
    } else {
      window.location.reload();
    }
  };

  const handleEnterApp = () => {
    setIsLoginModalOpen(true);
  };

  if (!isAuthReady) {
    return <LoadingScreen isDarkMode={isDarkMode} />;
  }

  if (!user) {
    return (
      <>
        <SplashPage onEnterApp={handleEnterApp} />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  const showSendNoteBackButton = user.role !== 'non-player';

  return (
    <div className="App min-h-screen flex flex-col bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
        user={user}
        onOpenSendEncouragement={() => handleNavigate('send-note')}
        canSendEncouragement={canSendEncouragement}
        currentPage={currentPage}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {appMessage.text && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-lg shadow-lg text-white ${appMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
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
        {currentPage === 'courses' && (
          <Courses
            key={coursesKey}
            setIsEncouragementModalOpen={setIsEncouragementModalOpen}
          />
        )}
        {currentPage === 'settings' && (
          <Suspense fallback={<div>Loading Settings...</div>}>
            <LazySettingsPage onSignOut={handleSignOut} />
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
        {currentPage === 'in-the-bag' && (
          <Suspense fallback={<div>Loading In The Bag...</div>}>
            <LazyInTheBagPage />
          </Suspense>
        )}
        {currentPage === 'news' && (
          <Suspense fallback={<div>Loading News...</div>}>
            <LazyNewsFeed />
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
          <Dialog.Content className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="text-center">
              <Dialog.Title className="text-xl font-bold mb-4 text-gray-800 dark:text-white">App Update Available!</Dialog.Title>
              <Dialog.Description className="mb-6 text-gray-700 dark:text-gray-300">A new version of the app is ready. Please refresh to get the latest features and bug fixes.</Dialog.Description>
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