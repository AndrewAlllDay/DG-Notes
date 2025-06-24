// src/components/Header.jsx

import React, { useState } from "react";
import { Menu, X, ThumbsUp, LogOut, Send } from "lucide-react"; // Import LogOut icon, and Send icon for the new button
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement, onSignOut, user, onOpenSendEncouragement, canSendEncouragement }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-4 relative">
                {/* Left side (hamburger menu) */}
                <div className="absolute left-4 md:static">
                    <button
                        className="md:hidden text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent"
                        onClick={() => setIsOpen(!isOpen)}
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

                {/* Right side (Encourage Me! icon) */}
                {/* Removed the Send Note button from the main header here, it will only be in mobile nav */}
                <div className="absolute right-4 md:static flex items-center gap-2">
                    <button
                        onClick={onOpenEncouragement}
                        className="text-black hover:text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Encourage Me!"
                    >
                        <ThumbsUp size={24} />
                    </button>

                    <div className="w-7 md:hidden" /> {/* This div helps align the right-side elements on mobile if needed */}
                </div>
            </div>

            {/* Mobile nav links */}
            {isOpen && (
                <nav className="md:hidden px-4 pb-4 pt-5">
                    <ul className="flex flex-col gap-2 text-gray-700">
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('courses'); setIsOpen(false); }}>Courses</a></li>
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('settings'); setIsOpen(false); }}>Settings</a></li>
                        {user && canSendEncouragement && ( // Show send note link in mobile menu if user is logged in AND can send
                            <li className="nav-links">
                                <a href="#" onClick={() => { onOpenSendEncouragement(); setIsOpen(false); }} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                                    <Send size={20} /> Send Note
                                </a>
                            </li>
                        )}

                    </ul>
                </nav>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                <li><a href="#" onClick={() => onNavigate('settings')} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
                {/* Conditionally render Send Note link for desktop nav as well */}
                {user && canSendEncouragement && (
                    <li>
                        <a href="#" onClick={() => onOpenSendEncouragement()} className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150">
                            <Send size={20} /> Send Note
                        </a>
                    </li>
                )}
                <li><a href="#" onClick={onOpenEncouragement} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
                {user && ( // Show logout link in desktop menu if user is logged in
                    <li><a href="#" onClick={onSignOut} className="hover:text-red-600 transition-colors duration-150">Logout</a></li>
                )}
            </nav>
        </header>
    );
};

export default Header;
