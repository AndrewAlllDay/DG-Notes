<<<<<<< Updated upstream
<<<<<<< Updated upstream
// src/App.jsx (assuming this is your main app component)
=======
// src/App.jsx
>>>>>>> Stashed changes
=======
// src/App.jsx
>>>>>>> Stashed changes
import React, { useState } from 'react';
import Header from './components/Header'; // Assuming Header is here
import Courses from './components/Courses';
<<<<<<< Updated upstream
import SettingsPage from './components/SettingsPage'; // Import the new SettingsPage

function App() {
  // State to manage which page is currently active
  const [currentPage, setCurrentPage] = useState('courses'); // 'courses' or 'settings'
=======
import EncouragementModal from './components/EncouragementModal';
import AuthModal from './components/AuthModal'; // NEW IMPORT
import './styles/EncouragementModal.css';

import { AuthProvider } from './context/AuthContext.jsx'; // Make sure to use .jsx here

function App() {
  const [isEncouragementModalOpen, setIsEncouragementModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // NEW STATE FOR AUTH MODAL
  const [currentPage, setCurrentPage] = useState('courses');
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

  // Function to render the correct component based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'courses':
        return <Courses />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Courses />; // Fallback
    }
  };

  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="App">
      {/* Pass setCurrentPage down to Header so it can change the view */}
      <Header onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
=======
=======
>>>>>>> Stashed changes
    <AuthProvider>
      <div className="App min-h-screen flex flex-col bg-gray-100">
        <Header
          onNavigate={handleNavigate}
          onOpenEncouragement={() => setIsEncouragementModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)} // NEW PROP TO OPEN AUTH MODAL
        />

        <main className="flex-grow">
          {currentPage === 'courses' && <Courses />}
          {currentPage === 'settings' && <div>Settings Page Content (Coming Soon!)</div>}
        </main>

        <EncouragementModal
          isOpen={isEncouragementModalOpen}
          onClose={() => setIsEncouragementModalOpen(false)}
        />

        {/* NEW AUTH MODAL COMPONENT */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
        {/* END NEW AUTH MODAL COMPONENT */}

      </div>
    </AuthProvider>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  );
}

export default App;