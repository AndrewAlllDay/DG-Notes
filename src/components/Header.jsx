import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="w-full bg-white shadow-md sticky top-0 z-50">
            <div className="flex items-center justify-between px-4 py-4">
                {/* Left side (hamburger menu) */}
                <button
                    className="md:hidden text-gray-700"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Center logo */}
                <div className="flex-grow flex justify-center">
                    <h3 className="text-xl font-bold">DG Caddy Notes</h3>
                </div>

                {/* Placeholder for alignment */}
                <div className="w-7 md:hidden" />
            </div>

            {/* Mobile nav links */}
            {isOpen && (
                <nav className="md:hidden px-4 pb-4">
                    <ul className="flex flex-col gap-2 text-gray-700">
                        <li><a href="#">Dashboard</a></li>
                        <li><a href="#">Courses</a></li>
                        <li><a href="#">Settings</a></li>
                    </ul>
                </nav>
            )}

            {/* Desktop nav links */}
            <nav className="hidden md:flex justify-center gap-8 py-2 text-gray-700">
                <a href="#">Dashboard</a>
                <a href="#">Courses</a>
                <a href="#">Settings</a>
            </nav>
        </header>
    );
};

export default Header;
