// src/components/Header.jsx

import React, { useState } from "react";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { Menu, X } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg'; // Or '../assets/DG Logo.svg' if using img route

// Accept onNavigate prop from App.jsx
const Header = ({ onNavigate }) => {
=======
import { Menu, X, ThumbsUp, LogIn, LogOut } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';
import { useAuth } from '../context/AuthContext';

// Add onOpenAuthModal to props
const Header = ({ onNavigate, onOpenEncouragement, onOpenAuthModal }) => { // <-- UPDATED PROPS
>>>>>>> Stashed changes
=======
import { Menu, X, ThumbsUp, LogIn, LogOut } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';
import { useAuth } from '../context/AuthContext';

// Add onOpenAuthModal to props
const Header = ({ onNavigate, onOpenEncouragement, onOpenAuthModal }) => { // <-- UPDATED PROPS
>>>>>>> Stashed changes
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser, signOutUser, loading } = useAuth(); // Removed signInWithGoogle from here

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-4 relative"> {/* Added relative positioning */}
                {/* Left side (hamburger menu) */}
                <div className="absolute left-4 md:static"> {/* Positioned absolutely for centering */}
                    <button
                        className="md:hidden text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Center logo */}
                <div className="flex-grow flex justify-center cursor-pointer" onClick={() => onNavigate('courses')}>
                    <img
                        src={LogoImage}
                        alt="DG Caddy Notes Logo"
                        className="h-8 w-auto"
                    />
                </div>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                {/* Placeholder for alignment (ensure it matches the width of the left-side element if needed for perfect centering) */}
                <div className="absolute right-4 md:static"> {/* Positioned absolutely for centering */}
                    <div className="w-7 md:hidden" /> {/* This div's width should ideally match the hamburger menu's width */}
=======
=======
>>>>>>> Stashed changes
                {/* Right side (Encourage Me! icon for desktop) */}
                <div className="absolute right-4 md:static flex items-center pr-2 md:gap-4">
                    <button
                        onClick={onOpenEncouragement}
                        className="text-black hover:text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Encourage Me!"
                    >
                        <ThumbsUp size={24} />
                    </button>
                    <div className="w-7 md:hidden" />
>>>>>>> Stashed changes
                </div>
            </div>

            {/* Mobile nav links - Now handles opening the AuthModal */}
            {isOpen && (
                <nav className="md:hidden px-4 pb-4">
                    <ul className="flex flex-col gap-2 text-gray-700">
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('courses'); setIsOpen(false); }}>Courses</a></li>
                        {/* Updated Settings link */}
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('settings'); setIsOpen(false); }}>Settings</a></li>
<<<<<<< Updated upstream
=======
                        <li className="nav-links"><a href="#" onClick={() => { onOpenEncouragement(); setIsOpen(false); }}>Encourage Me!</a></li>
                        {/* Mobile Auth Link - UPDATED to open AuthModal or Sign Out */}
                        <li className="nav-links">
                            {loading ? (
                                <span className="text-gray-500">Loading...</span>
                            ) : (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentUser) {
                                            signOutUser();
                                        } else {
                                            onOpenAuthModal(); // <-- OPEN THE AUTH MODAL HERE
                                        }
                                        setIsOpen(false); // Close menu after action
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    {currentUser ? <LogOut size={20} /> : <LogIn size={20} />}
                                    {currentUser ? 'Sign Out' : 'Sign In'}
                                </a>
                            )}
                        </li>
                        {currentUser && (
                            <li className="text-sm text-gray-500 mt-2 ml-4">
                                Logged in as: {currentUser.email || currentUser.displayName || 'User'}
                            </li>
                        )}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
                    </ul>
                </nav>
            )}

            {/* Desktop nav links - Now handles opening the AuthModal */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                {/* Updated Settings link */}
                <li><a href="#" onClick={() => onNavigate('settings')} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
<<<<<<< Updated upstream
=======
                <li><a href="#" onClick={onOpenEncouragement} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
                {/* Desktop Auth Link - UPDATED to open AuthModal or Sign Out */}
                <li className="nav-links-desktop">
                    {loading ? (
                        <span className="text-gray-500">Loading...</span>
                    ) : (
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); currentUser ? signOutUser() : onOpenAuthModal(); }} // <-- OPEN THE AUTH MODAL HERE
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-150"
                        >
                            {currentUser ? <LogOut size={20} /> : <LogIn size={20} />}
                            {currentUser ? 'Sign Out' : 'Sign In'}
                        </a>
                    )}
                </li>
                {currentUser && (
                    <li className="text-sm text-gray-500 flex items-center">
                        {currentUser.email || currentUser.displayName || 'User'}
                    </li>
                )}
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
            </nav>
        </header>
    );
};

export default Header;