// src/components/Header.jsx

import React, { useCallback, useMemo } from "react";
import { ThumbsUp, Settings, Flag, Backpack, Newspaper, ClipboardList } from "lucide-react";
import LogoImage from '../assets/DG Logo.svg';

// ✨ 1. Created a new, reusable NavItem component to reduce duplication.
const NavItem = ({ pageName, icon: Icon, label, isActive, onClick }) => {
    const activeColor = 'spec-sec';
    const inactiveColor = 'text-gray-700';
    const activeText = 'font-bold';

    return (
        <div
            className={`flex flex-col items-center w-20 text-center transition-colors cursor-pointer p-2 ${isActive ? `${activeColor} ${activeText}` : inactiveColor}`}
            onClick={() => onClick(pageName)}
        >
            <Icon size={20} />
            <span className="text-xs mt-1 leading-tight">{label}</span>
        </div>
    );
};

// ✨ 2. Wrapped the Header component in React.memo.
const Header = React.memo(({ onNavigate, onOpenEncouragement, user, currentPage }) => {

    // ✨ 3. Used useMemo for derived values. This recalculates only when `user` changes.
    const isNonPlayer = useMemo(() => user?.role === 'non-player', [user]);

    // ✨ 4. Used useCallback for event handlers. This function is now memoized.
    const handleNavigate = useCallback((page) => {
        onNavigate(page);
    }, [onNavigate]);

    const isActive = useCallback((pageName) => currentPage === pageName, [currentPage]);

    // ✨ 5. Defined navigation links as an array of objects for easier mapping and maintenance.
    const navLinks = useMemo(() => [
        { pageName: 'in-the-bag', icon: Backpack, label: 'In The Bag', playerOnly: true },
        { pageName: 'media', icon: Newspaper, label: 'Media', playerOnly: false },
        { pageName: 'scores', icon: ClipboardList, label: 'Scores', playerOnly: true },
    ], []);

    const leftNavLinks = navLinks.filter(link => ['in-the-bag', 'media'].includes(link.pageName));
    const rightNavLinks = navLinks.filter(link => link.pageName === 'scores');

    return (
        <>
            {/* Top header remains largely the same */}
            <header className="w-full bg-white shadow-md sticky top-0 z-40">
                <div className="relative flex items-center justify-between px-4 h-20">
                    <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => handleNavigate(isNonPlayer ? 'send-note' : 'home')}
                    >
                        <img src={LogoImage} alt="FlightLog Logo" className="h-24 md:h-20 lg:h-16 w-auto" />
                    </div>
                    {user && (
                        <div
                            className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center p-2 rounded-full cursor-pointer hover:bg-gray-100 ${isActive('settings') ? 'bg-gray-200' : ''}`}
                            onClick={() => handleNavigate('settings')}
                        >
                            <Settings size={24} className={isActive('settings') ? 'spec-sec' : 'text-gray-700'} />
                        </div>
                    )}
                </div>
            </header>

            {/* Bottom navigation bar is now much cleaner */}
            <div className="fixed bottom-0 left-0 right-0 h-20 z-50" style={{ filter: "drop-shadow(0 -2px 5px rgba(0,0,0,0.1))" }}>
                <nav className="absolute bottom-0 left-0 right-0 bg-white flex w-full justify-between items-center h-16 px-2">

                    {/* ✨ 6. Mapped over the arrays to render NavItem components */}
                    <div className="flex items-center justify-around w-2/5">
                        {leftNavLinks.map(link => (
                            (!link.playerOnly || !isNonPlayer) && (
                                <NavItem
                                    key={link.pageName}
                                    {...link}
                                    isActive={isActive(link.pageName)}
                                    onClick={handleNavigate}
                                />
                            )
                        ))}
                    </div>

                    <div className="flex items-center justify-around w-2/5">
                        {rightNavLinks.map(link => (
                            (!link.playerOnly || !isNonPlayer) && (
                                <NavItem
                                    key={link.pageName}
                                    {...link}
                                    isActive={isActive(link.pageName)}
                                    onClick={handleNavigate}
                                />
                            )
                        ))}
                        {!isNonPlayer && (
                            <div
                                className="flex flex-col items-center w-20 text-center text-gray-700 hover:text-purple-800 transition-colors cursor-pointer p-2"
                                onClick={onOpenEncouragement}
                            >
                                <ThumbsUp size={20} />
                                <span className="text-xs mt-1 leading-tight">Encourage</span>
                            </div>
                        )}
                    </div>
                </nav>

                {!isNonPlayer && (
                    <div
                        className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-20 rounded-full flex flex-col items-center justify-center cursor-pointer bg-white"
                        onClick={() => handleNavigate('courses')}
                    >
                        <Flag size={32} className={isActive('courses') ? 'spec-sec' : 'text-gray-700'} />
                        <span className={`text-xs mt-1 ${isActive('courses') ? 'font-bold spec-sec' : 'text-gray-700'}`}>
                            Courses
                        </span>
                    </div>
                )}
            </div>
        </>
    );
});

export default Header;