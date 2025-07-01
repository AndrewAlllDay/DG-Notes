// src/components/SplashPage.jsx
import React from 'react';
import LogoImage from '../assets/DG Logo.svg'; // Make sure this path is correct

const SplashPage = ({ onEnterApp }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300">
            <img
                src={LogoImage}
                alt="DG Caddy Notes Logo"
                className="h-24 w-auto mb-8 animate-fade-in" // Increased size, added mb-8 for spacing, and a simple animation
            />


            <p className="text-lg md:text-xl text-center max-w-2xl leading-relaxed mb-10 animate-fade-in delay-400">
                Your ultimate disc golf companion.
                Take notes on courses, track your bag, and receive encouragement from your community.
                Get ready to elevate your game!
            </p>

            <button
                onClick={onEnterApp}
                className="px-8 py-4 spec-sec-bg hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in delay-600"
            >
                Start Taking Notes!
            </button>
        </div>
    );
};

export default SplashPage;