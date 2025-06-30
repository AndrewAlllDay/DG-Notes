// src/components/Header.jsx

import React from "react";
// Remove LogOut from imports
import { ThumbsUp, Send, Settings, Flag, Backpack } from "lucide-react"; // Import Backpack icon, removed LogOut
import LogoImage from '../assets/DG Logo.svg';

// Remove onSignOut from destructured props
const Header = ({ onNavigate, onOpenEncouragement, user, onOpenSendEncouragement, canSendEncouragement, currentPage }) => {

    const isNonPlayer = user && user.role === 'non-player';

    const handleNavigate = (page, event) => {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        console.log("DEBUG Header: Navigating to page:", page);
        onNavigate(page);
    };

    // Helper function to determine if a link is active
    const isActive = (pageName) => currentPage === pageName;

    const activeIconColor = 'text-blue-600'; // Define your active color
    const activeTextColor = 'font-bold text-blue-600'; // Define active text color
    const inactiveIconColor = 'text-gray-700'; // Default inactive color
    const inactiveTextColor = 'text-gray-700'; // Default inactive text color

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            {/* Top row: Logo only */}
            <div className="flex items-center justify-center px-4 py-4">
                <div
                    className="flex-grow flex justify-center cursor-pointer"
                    // Adjust logo navigation based on role, and make it active if it corresponds to the current page
                    onClick={(e) => handleNavigate(isNonPlayer ? 'send-note' : 'courses', e)}
                >
                    <img
                        src={LogoImage}
                        alt="DG Caddy Notes Logo"
                        className="h-12 w-auto"
                    />
                </div>
            </div>

            {/* Mobile navigation - ALWAYS VISIBLE, horizontal layout, stacked icons and titles */}
            <nav className="flex md:hidden w-full justify-around items-center py-2 border-t border-gray-200">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('courses') ? activeTextColor : inactiveTextColor}`} // Apply text color
                        onClick={(e) => handleNavigate('courses', e)}
                    >
                        <Flag size={20} className={isActive('courses') ? activeIconColor : inactiveIconColor} /> {/* Apply icon color */}
                        <span className="text-xs mt-1">Courses</span>
                    </div>
                )}
                {/* In The Bag link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('in-the-bag') ? activeTextColor : inactiveTextColor}`}
                        onClick={(e) => handleNavigate('in-the-bag', e)}
                    >
                        <Backpack size={20} className={isActive('in-the-bag') ? activeIconColor : inactiveIconColor} />
                        <span className="text-xs mt-1">In The Bag</span>
                    </div>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('send-note') ? activeTextColor : inactiveTextColor}`}
                        onClick={(e) => handleNavigate('send-note', e)}
                    >
                        <Send size={20} className={isActive('send-note') ? activeIconColor : inactiveIconColor} />
                        <span className="text-xs mt-1">Send Note</span>
                    </div>
                )}
                {/* Encourage Me! link (no direct page, so this one is special) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-black hover:text-purple-800 transition-colors cursor-pointer p-2"
                        onClick={onOpenEncouragement}
                    >
                        <ThumbsUp size={20} />
                        <span className="text-xs mt-1">Encourage Me!</span>
                    </div>
                )}

                {/* Settings link - REMOVED !isNonPlayer CONDITION */}
                {user && ( // Ensure user is logged in to see settings
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('settings') ? activeTextColor : inactiveTextColor}`}
                        onClick={(e) => handleNavigate('settings', e)}
                    >
                        <Settings size={20} className={isActive('settings') ? activeIconColor : inactiveIconColor} />
                        <span className="text-xs mt-1">Settings</span>
                    </div>
                )}

                {/* Logout link removed from here */}
            </nav>

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li>
                        <a
                            href="#"
                            onClick={(e) => handleNavigate('courses', e)}
                            className={`hover:text-blue-600 transition-colors duration-150
                                ${isActive('courses') ? activeTextColor : inactiveTextColor}`}
                        >
                            Courses
                        </a>
                    </li>
                )}
                {/* In The Bag link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li>
                        <a
                            href="#"
                            onClick={(e) => handleNavigate('in-the-bag', e)}
                            className={`hover:text-blue-600 transition-colors duration-150
                                ${isActive('in-the-bag') ? activeTextColor : inactiveTextColor}`}
                        >
                            In The Bag
                        </a>
                    </li>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <li>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onOpenSendEncouragement();
                            }}
                            className={`flex items-center gap-1 hover:text-blue-600 transition-colors duration-150
                                ${isActive('send-note') ? activeTextColor : inactiveTextColor}`}
                        >
                            <Send size={20} className={isActive('send-note') ? activeIconColor : inactiveIconColor} /> Send Note
                        </a>
                    </li>
                )}
                {/* Encourage Me! link (no active state for this one) */}
                {!isNonPlayer && (
                    <li>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onOpenEncouragement();
                            }}
                            className="hover:text-purple-600 transition-colors duration-150"
                        >
                            Encourage Me!
                        </a>
                    </li>
                )}

                {/* Settings link - REMOVED !isNonPlayer CONDITION */}
                {user && ( // Ensure user is logged in to see settings
                    <li>
                        <a
                            href="#"
                            onClick={(e) => handleNavigate('settings', e)}
                            className={`hover:text-blue-600 transition-colors duration-150
                                ${isActive('settings') ? activeTextColor : inactiveTextColor}`}
                        >
                            Settings
                        </a>
                    </li>
                )}

                {/* Logout link removed from here */}
            </nav>
        </header>
    );
};

export default Header;