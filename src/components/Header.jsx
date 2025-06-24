// src/components/Header.jsx

import React from "react"; // Removed useState as isOpen state is no longer needed
import { ThumbsUp, LogOut, Send, Settings, Flag } from "lucide-react"; // Removed Menu and X icons
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement, onSignOut, user, onOpenSendEncouragement, canSendEncouragement }) => {
    // const [isOpen, setIsOpen] = useState(false); // Removed isOpen state

    // Determine if the current user is a 'non-player'
    const isNonPlayer = user && user.role === 'non-player';

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            {/* Top row: Logo only */}
            <div className="flex items-center justify-center px-4 py-4"> {/* Changed to justify-center as no other elements on this row */}
                {/* Center logo - now the only element in the top bar on mobile */}
                <div className="flex-grow flex justify-center cursor-pointer" onClick={() => onNavigate(isNonPlayer ? 'send-note' : 'courses')}>
                    <img
                        src={LogoImage}
                        alt="DG Caddy Notes Logo"
                        className="h-12 w-auto" // Changed h-8 to h-12 to make the logo bigger
                    />
                </div>
            </div>

            {/* Mobile navigation - ALWAYS VISIBLE, horizontal layout, stacked icons and titles */}
            {/* This navigation will be displayed using flexbox, distributing items evenly */}
            <nav className="flex md:hidden w-full justify-around items-center py-2 ">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={() => onNavigate('courses')}
                    >
                        <Flag size={20} />
                        <span className="text-xs mt-1">Courses</span>
                    </div>
                )}
                {/* Settings link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={() => onNavigate('settings')}
                    >
                        <Settings size={20} />
                        <span className="text-xs mt-1">Settings</span>
                    </div>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <div
                        className="flex flex-col items-center text-gray-700 hover:text-blue-600 transition-colors cursor-pointer p-2"
                        onClick={() => onOpenSendEncouragement()}
                    >
                        <Send size={20} />
                        <span className="text-xs mt-1">Send Note</span>
                    </div>
                )}
                {/* Encourage Me! link (only for non-non-players) */}
                {!isNonPlayer && (
                    <div
                        className="flex flex-col items-center text-black hover:text-purple-800 transition-colors cursor-pointer p-2"
                        onClick={onOpenEncouragement}
                    >
                        <ThumbsUp size={20} />
                        <span className="text-xs mt-1">Encourage Me!</span>
                    </div>
                )}
                {/* Logout link (for any logged-in user) */}
                {user && (
                    <div
                        className="flex flex-col items-center text-red-600 hover:text-red-800 transition-colors cursor-pointer p-2"
                        onClick={onSignOut}
                    >
                        <LogOut size={20} />
                        <span className="text-xs mt-1">Logout</span>
                    </div>
                )}
            </nav>

            {/* Desktop nav links (remains unchanged) */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                {/* Courses link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                )}
                {/* Settings link (only for non-non-players) */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={() => onNavigate('settings')} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
                )}
                {/* Send Note link (for any logged-in user who can send) */}
                {user && canSendEncouragement && (
                    <li>
                        <a href="#" onClick={() => onOpenSendEncouragement()} className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150">
                            <Send size={20} /> Send Note
                        </a>
                    </li>
                )}
                {/* Encourage Me! link (only for non-non-players) - still present for desktop */}
                {!isNonPlayer && (
                    <li><a href="#" onClick={onOpenEncouragement} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
                )}
                {/* Logout link (for any logged-in user) */}
                {user && (
                    <li><a href="#" onClick={onSignOut} className="hover:text-red-600 transition-colors duration-150">Logout</a></li>
                )}
            </nav>
        </header>
    );
};

export default Header;
