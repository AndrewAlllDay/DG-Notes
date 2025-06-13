// src/components/Header.jsx

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg'; // Or '../assets/DG Logo.svg' if using img route

// Accept onNavigate prop from App.jsx
const Header = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-4">
                {/* Left side (hamburger menu) */}
                <button
                    className="md:hidden text-gray-700 !bg-transparent border-none focus:outline-none active:bg-transparent"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Center logo */}
                <div className="flex-grow flex justify-center cursor-pointer" onClick={() => onNavigate('courses')}>
                    <img
                        src={LogoImage}
                        alt="DG Caddy Notes Logo"
                        className="h-8 w-auto"
                    />
                </div>

                {/* Placeholder for alignment */}
                <div className="w-7 md:hidden" />
            </div>

            {/* Mobile nav links */}
            {isOpen && (
                <nav className="md:hidden px-4 pb-4">
                    <ul className="flex flex-col gap-2 text-gray-700">
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('courses'); setIsOpen(false); }}>Courses</a></li>
                        {/* Updated Settings link */}
                        <li className="nav-links"><a href="#" onClick={() => { onNavigate('settings'); setIsOpen(false); }}>Settings</a></li>
                    </ul>
                </nav>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                <li><a href="#" onClick={() => onNavigate('courses')} className="hover:text-blue-600 transition-colors duration-150">Courses</a></li>
                {/* Updated Settings link */}
                <li><a href="#" onClick={() => onNavigate('settings')} className="hover:text-blue-600 transition-colors duration-150">Settings</a></li>
            </nav>
        </header>
    );
};

export default Header;