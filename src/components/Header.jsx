// src/components/Header.jsx

import React from "react";
import { ThumbsUp, Send, Settings, Flag, Backpack } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement, user, canSendEncouragement, currentPage }) => {

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

    const activeIconColor = 'spec-sec'; // Define your active color
    const activeTextColor = 'font-bold spec-sec'; // Define active text color
    const inactiveIconColor = 'text-gray-700'; // Default inactive color
    const inactiveTextColor = 'text-gray-700'; // Default inactive text color

    return (
        <>
            {/* Part 1: The top header with the logo */}
            <header className="w-full bg-white shadow-md sticky top-0 z-40">
                <div className="flex items-center justify-center px-4 py-4">
                    <div
                        className="flex-grow flex justify-center cursor-pointer"
                        onClick={(e) => handleNavigate(isNonPlayer ? 'send-note' : 'courses', e)}
                    >
                        <img
                            src={LogoImage}
                            alt="DG Caddy Notes Logo"
                            className="h-12 w-auto"
                        />
                    </div>
                </div>
            </header>

            {/* Part 2: The fixed bottom navigation bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] z-50 flex w-full justify-around items-center py-2 border-t border-gray-200">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('courses') ? activeTextColor : inactiveTextColor}`}
                        onClick={(e) => handleNavigate('courses', e)}
                    >
                        <Flag size={20} className={isActive('courses') ? activeIconColor : inactiveIconColor} />
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
                {/* Encourage Me! link */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-black hover:text-purple-800 transition-colors cursor-pointer p-2"
                        onClick={onOpenEncouragement}
                    >
                        <ThumbsUp size={20} />
                        <span className="text-xs mt-1">Encourage Me!</span>
                    </div>
                )}
                {/* Settings link */}
                {user && (
                    <div
                        className={`flex flex-col items-center hover:text-blue-600 transition-colors cursor-pointer p-2
                            ${isActive('settings') ? activeTextColor : inactiveTextColor}`}
                        onClick={(e) => handleNavigate('settings', e)}
                    >
                        <Settings size={20} className={isActive('settings') ? activeIconColor : inactiveIconColor} />
                        <span className="text-xs mt-1">Settings</span>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Header;