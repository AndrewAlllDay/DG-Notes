// src/components/Header.jsx

import React, { useState } from "react";
import { Menu, X, ThumbsUp } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';

const Header = ({ onNavigate, onOpenEncouragement }) => {
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

                {/* Right side (Encourage Me! icon for desktop, placeholder for mobile alignment) */}
                {/* Adjusted positioning and icon color */}
                <div className="absolute right-4 md:static flex items-center"> {/* Added pr-4 for more right padding */}
                    <button
                        onClick={onOpenEncouragement}
                        className="text-black hover:text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent p-1 rounded-full hover:bg-gray-100 transition-colors" // Changed text-purple-600 to text-black, adjusted hover
                        aria-label="Encourage Me!"
                    >
                        <ThumbsUp size={24} />
                    </button>

                    <div className="w-7 md:hidden" />
                </div>
            </div>

            {/* Mobile nav links */}
            {isOpen && (
                <nav className="md:hidden px-4 pb-4">
                    <ul className="flex flex-col gap-2 text-gray-700">
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('courses'); setIsOpen(false); }}>Courses</a></li>
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('settings'); setIsOpen(false); }}>Settings</a></li>
                        <li className="nav-links"><a href="#" onClick={() => { onOpenEncouragement(); setIsOpen(false); }}>Encourage Me!</a></li>
                    </ul>
                </nav>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                <li><a href="#" onClick={() => onNavigate('settings')} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
                <li><a href="#" onClick={onOpenEncouragement} className="hover:text-purple-600 transition-colors duration-150">Encourage Me!</a></li>
            </nav>
        </header>
    );
};

export default Header;