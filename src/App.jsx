import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Courses from './components/Courses';
import EncouragementModal from './components/EncouragementModal';
import LoginPage from './components/LoginPage'; // Import the new Login Page
import SettingsPage from './components/SettingsPage'; // Import SettingsPage
import './styles/EncouragementModal.css';

// Import useFirebase and the auth instance directly from firebase.js
import { useFirebase, auth } from './firebase'; // Import 'auth' specifically

function App() {
  // Now destructure only user and isAuthReady from useFirebase.
  // We will use the imported 'auth' instance for signOut.
  const { user, isAuthReady } = useFirebase();

  console.log("DEBUG: App.jsx - user:", user);
  console.log("DEBUG: App.jsx - isAuthReady:", isAuthReady);
  console.log("DEBUG: App.jsx - Direct 'auth' instance:", auth);


  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('courses'); // Manage current page state

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    console.log("DEBUG: handleSignOut called. Attempting signOut(auth).");
    if (auth) { // Ensure auth instance is available
      try {
        await auth.signOut(); // Call signOut method directly on the auth instance
        console.log("DEBUG: User signed out successfully.");
        setCurrentPage('courses'); // Go back to courses page after sign out
      } catch (error) {
        console.error("DEBUG: Error signing out:", error);
        alert("Failed to sign out. Please try again. Error: " + error.message);
      }
    } else {
      console.error("DEBUG: Firebase Auth instance is not available for signOut.");
      alert("Logout failed: Authentication service not ready. Please try refreshing.");
    }
  };

  // Show a loading screen while authentication status is being determined
  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
        Loading application...
      </div>
    );
  }

  // If user is NOT authenticated, show the LoginPage
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <LoginPage />
      </div>
    );
  }

  // If user IS authenticated, show the main app content
  return (
    <div className="App min-h-screen flex flex-col bg-gray-100">
      <Header
        onNavigate={handleNavigate}
        onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
        onSignOut={handleSignOut} // Pass signOut to Header
        user={user} // Pass user to Header for display (e.g., to conditionally show logout button)
      />

      <main className="flex-grow">
        {currentPage === 'courses' && <Courses />}
        {currentPage === 'settings' && <SettingsPage />} {/* Render SettingsPage */}
      </main>

      <EncouragementModal
        isOpen={isEncouragementModalOpen}
        onClose={() => setIsEncouragementModalOpen(false)}
      />
    </div>
  );
}

export default App;
