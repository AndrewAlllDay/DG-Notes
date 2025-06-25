// src/components/Header.jsx

import React, { useState, useEffect, useRef } from "react";
import { ThumbsUp, LogOut, Send, Settings, Flag, MoreVertical, CloudSun } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement, onSignOut, user, onOpenSendEncouragement, canSendEncouragement }) => {
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isNonPlayer = user && user.role === 'non-player';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            console.log("DEBUG Header: handleClickOutside triggered. Target:", event.target);
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                console.log("DEBUG Header: Clicked outside dropdown, closing.");
                setIsMoreDropdownOpen(false);
            }
        };
        // Use 'click' for desktop and 'touchend' for mobile for broader compatibility
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchend", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchend", handleClickOutside);
        };
    }, []);

    const handleNavigateAndCloseDropdown = (page) => {
        console.log("DEBUG Header: handleNavigateAndCloseDropdown called for page:", page);
        onNavigate(page);
        setIsMoreDropdownOpen(false);
    };

    // Debug log for dropdown state
    console.log("DEBUG Header: Current isMoreDropdownOpen state:", isMoreDropdownOpen);

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            {/* Top row: Logo only */}
            <div className="flex items-center justify-center px-4 py-4">
                <div className="flex-grow flex justify-center cursor-pointer" onClick={() => handleNavigateAndCloseDropdown(isNonPlayer ? 'send-note' : 'courses')}>
                    <img
                        src={LogoImage}
                        alt="DG Caddy Notes Logo"
                        className="h-12 w-auto"
                    />
                </div>
            </div>

            {/* Mobile navigation - ALWAYS VISSIBLE, horizontal layout, stacked icons and titles */}
            <nav className="flex md:hidden w-full justify-around items-center py-2 border-t border-gray-200 min-h-16">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={() => handleNavigateAndCloseDropdown('courses')}
                    >
                        <Flag size={20} />
                        <span className="text-xs mt-1">Courses</span>
                    </div>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={() => handleNavigateAndCloseDropdown('send-note')}
                    >
                        <Send size={20} />
                        <span className="text-xs mt-1">Send Note</span>
                    </div>
                )}
                {/* Encourage Me! link (only for non-non-players) - moved OUT of dropdown for mobile */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-black hover:text-purple-800 transition-colors cursor-pointer p-2"
                        onClick={onOpenEncouragement}
                    >
                        <ThumbsUp size={20} />
                        <span className="text-xs mt-1">Encourage Me!</span>
                    </div>
                )}

                {/* "More" dropdown for mobile */}
                <li className="relative flex flex-col items-center p-2" ref={dropdownRef}>
                    <button
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none"
                        onClick={(e) => {
                            e.preventDefault(); // Prevent default button behavior
                            console.log("DEBUG Header: Toggling mobile More dropdown via button click. Current state:", isMoreDropdownOpen);
                            setIsMoreDropdownOpen(prev => !prev);
                        }}
                    >
                        <MoreVertical size={20} />
                        <span className="text-xs mt-1">More</span>
                    </button>

                    {isMoreDropdownOpen && (
                        <ul className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-40 z-[9999]"> {/* Increased z-index to z-[9999] */}
                            {/* Settings link (only for non-non-players) */}
                            {!isNonPlayer && (
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Clicked dropdown item (mobile) for page: settings");
                                        handleNavigateAndCloseDropdown('settings');
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Touch started on dropdown item (mobile) for page: settings");
                                    }}
                                >
                                    <Settings size={18} /> Settings
                                </li>
                            )}
                            {/* NEW Weather Link */}
                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("DEBUG Header: Clicked dropdown item (mobile) for page: weather");
                                    handleNavigateAndCloseDropdown('weather');
                                }}
                                onTouchStart={(e) => {
                                    e.stopPropagation();
                                    console.log("DEBUG Header: Touch started on dropdown item (mobile) for page: weather");
                                }}
                            >
                                <CloudSun size={18} /> Weather
                            </li>
                            {/* Logout link (for any logged-in user) - moved INTO dropdown for mobile */}
                            {user && (
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Clicked dropdown item (mobile) for logout.");
                                        onSignOut();
                                        setIsMoreDropdownOpen(false);
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Touch started on dropdown item (mobile) for logout.");
                                    }}
                                >
                                    <LogOut size={18} /> Logout
                                </li>
                            )}
                        </ul>
                    )}
                </li>
            </nav>

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <li>
                        <a href="#" onClick={() => onOpenSendEncouragement()} className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150">
                            <Send size={20} /> Send Note
                        </a>
                    </li>
                )}
                {/* Encourage Me! link (only for non-non-players) - moved OUT of dropdown for desktop */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={onOpenEncouragement} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
                )}

                {/* "More" dropdown for desktop */}
                <li className="relative" ref={dropdownRef}>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        console.log("DEBUG Header: Toggling desktop More dropdown. Current state:", isMoreDropdownOpen);
                        setIsMoreDropdownOpen(!isMoreDropdownOpen);
                    }} className="hover:text-blue-600 transition-colors duration-150 flex items-center gap-1">
                        More <MoreVertical size={16} />
                    </a>
                    {isMoreDropdownOpen && (
                        <ul className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-40 z-[9999]"> {/* Increased z-index to z-[9999] */}
                            {/* Settings link (only for non-non-players) */}
                            {!isNonPlayer && (
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Clicked dropdown item (desktop) for page: settings");
                                        handleNavigateAndCloseDropdown('settings');
                                    }}>
                                    <Settings size={18} /> Settings
                                </li>
                            )}
                            {/* NEW Weather Link */}
                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("DEBUG Header: Clicked dropdown item (desktop) for page: weather");
                                    handleNavigateAndCloseDropdown('weather');
                                }}>
                                <CloudSun size={18} /> Weather
                            </li>
                            {/* Logout link (for any logged-in user) - moved INTO dropdown for desktop */}
                            {user && (
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log("DEBUG Header: Clicked dropdown item (desktop) for logout.");
                                        onSignOut();
                                        setIsMoreDropdownOpen(false);
                                    }}>
                                    <LogOut size={18} /> Logout
                                </li>
                            )}
                        </ul>
                    )}
                </li>
            </nav>
        </header>
    );
};

export default Header;
