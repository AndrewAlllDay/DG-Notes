// src/components/Header.jsx

import React, { useState } from "react"; // Removed useEffect, useRef as they are not needed for simple nav
// Removed MoreVertical, CloudSun imports
import { ThumbsUp, LogOut, Send, Settings, Flag } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement, onSignOut, user, onOpenSendEncouragement, canSendEncouragement }) => {
    // Removed isMoreDropdownOpen state and dropdownRef ref

    const isNonPlayer = user && user.role === 'non-player';

    // Removed useEffect for handleClickOutside
    // Removed handleDropdownClick helper function

    // This function is for all navigation links now
    const handleNavigate = (page, event) => {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault(); // Prevent default link behavior if it's an anchor tag
        }
        console.log("DEBUG Header: Navigating to page:", page);
        onNavigate(page);
    };

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            {/* Top row: Logo only */}
            <div className="flex items-center justify-center px-4 py-4">
                <div className="flex-grow flex justify-center cursor-pointer" onClick={(e) => handleNavigate(isNonPlayer ? 'send-note' : 'courses', e)}>
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
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={(e) => handleNavigate('courses', e)}
                    >
                        <Flag size={20} />
                        <span className="text-xs mt-1">Courses</span>
                    </div>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={(e) => handleNavigate('send-note', e)}
                    >
                        <Send size={20} />
                        <span className="text-xs mt-1">Send Note</span>
                    </div>
                )}
                {/* Encourage Me! link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-black hover:text-purple-800 transition-colors cursor-pointer p-2"
                        onClick={onOpenEncouragement} // Direct call to prop
                    >
                        <ThumbsUp size={20} />
                        <span className="text-xs mt-1">Encourage Me!</span>
                    </div>
                )}

                {/* Settings link (only for non-non-players) - Re-added to main mobile nav */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={(e) => handleNavigate('settings', e)}
                    >
                        <Settings size={20} />
                        <span className="text-xs mt-1">Settings</span>
                    </div>
                )}

                {/* Logout link (for any logged-in user) - Re-added to main mobile nav */}
                {user && (
                    <div
                        className="flex flex-col items-center text-red-600 hover:text-red-800 transition-colors cursor-pointer p-2"
                        onClick={onSignOut} // Direct call to prop
                    >
                        <LogOut size={20} />
                        <span className="text-xs mt-1">Logout</span>
                    </div>
                )}
            </nav>

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={(e) => handleNavigate('courses', e)} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <li>
                        <a href="#" onClick={(e) => {
                            e.preventDefault(); // Keep preventDefault for anchor
                            onOpenSendEncouragement();
                        }} className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150">
                            <Send size={20} /> Send Note
                        </a>
                    </li>
                )}
                {/* Encourage Me! link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={(e) => {
                        e.preventDefault(); // Keep preventDefault for anchor
                        onOpenEncouragement();
                    }} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
                )}

                {/* Settings link (only for non-non-players) - Re-added to main desktop nav */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={(e) => handleNavigate('settings', e)} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
                )}

                {/* Logout link (for any logged-in user) - Re-added to main desktop nav */}
                {user && (
                    <li>
                        <a href="#" onClick={(e) => {
                            e.preventDefault(); // Keep preventDefault for anchor
                            onSignOut();
                        }} className="hover:text-red-600 transition-colors duration-150">Logout</a>
                    </li>
                )}
            </nav>
        </header>
    );
};

export default Header;