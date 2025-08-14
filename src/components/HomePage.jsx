// src/components/HomePage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFirebase } from '../firebase';
import { subscribeToUserDiscs, subscribeToCourses, subscribeToRounds } from '../services/firestoreService';
import { getTtlCache, setTtlCache } from '../utilities/cache';
import { format } from 'date-fns';
import { Circle, Map, ListChecks } from 'lucide-react';

// Memoized summary card component to prevent unnecessary re-renders
const SummaryCard = React.memo(({ icon, title, value, unit }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {value} <span className="text-lg font-medium">{unit}</span>
            </p>
        </div>
    </div>
));

// Optimized count-up hook with better performance
const useCountUp = (endValue, duration = 1500) => {
    const [count, setCount] = useState(0);
    const animationFrameRef = useRef();
    const startTimeRef = useRef(null);

    useEffect(() => {
        // Reset animation when endValue changes
        startTimeRef.current = null;
        setCount(0);

        if (endValue === 0) {
            setCount(0);
            return;
        }

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;

            const progress = timestamp - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);

            // Use easeOutCubic for smoother animation
            const easedPercentage = 1 - Math.pow(1 - percentage, 3);
            const currentCount = Math.floor(easedPercentage * endValue);

            setCount(currentCount);

            if (progress < duration) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [endValue, duration]);

    return count;
};

export default function HomePage({ onNavigate }) {
    const { user } = useFirebase();

    // Consolidated state for better performance
    const [dashboardData, setDashboardData] = useState({
        discCount: 0,
        courseCount: 0,
        lastTwoRounds: []
    });

    const [isLoading, setIsLoading] = useState(true);

    // Memoize user ID to prevent unnecessary effect re-runs
    const userId = useMemo(() => user?.uid, [user?.uid]);

    // Memoize cache key
    const cacheKey = useMemo(() =>
        userId ? `dashboardData_${userId}` : null,
        [userId]
    );

    // Optimized count animations
    const animatedDiscCount = useCountUp(dashboardData.discCount);
    const animatedCourseCount = useCountUp(dashboardData.courseCount);

    // Memoized format function
    const formatScoreToPar = useCallback((score) => {
        if (score === 0) return 'E';
        if (score > 0) return `+${score}`;
        return score;
    }, []);

    // Optimized cache update function
    const updateCache = useCallback((key, updates) => {
        if (!key) return;

        const currentCache = getTtlCache(key) || {};
        const newCache = { ...currentCache, ...updates };

        // Only update cache if data actually changed
        if (JSON.stringify(currentCache) !== JSON.stringify(newCache)) {
            setTtlCache(key, newCache);
        }
    }, []);

    // Optimized data update functions
    const updateDiscCount = useCallback((newCount) => {
        setDashboardData(prev => {
            if (prev.discCount === newCount) return prev;
            return { ...prev, discCount: newCount };
        });
        updateCache(cacheKey, { discCount: newCount });
    }, [cacheKey, updateCache]);

    const updateCourseCount = useCallback((newCount) => {
        setDashboardData(prev => {
            if (prev.courseCount === newCount) return prev;
            return { ...prev, courseCount: newCount };
        });
        updateCache(cacheKey, { courseCount: newCount });
    }, [cacheKey, updateCache]);

    const updateLastTwoRounds = useCallback((newRounds) => {
        const roundsToStore = newRounds.slice(0, 2);
        setDashboardData(prev => {
            if (JSON.stringify(prev.lastTwoRounds) === JSON.stringify(roundsToStore)) {
                return prev;
            }
            return { ...prev, lastTwoRounds: roundsToStore };
        });
        updateCache(cacheKey, { lastTwoRounds: roundsToStore });
    }, [cacheKey, updateCache]);

    // Main data subscription effect
    useEffect(() => {
        if (!userId || !cacheKey) {
            setIsLoading(false);
            return;
        }

        // Load cached data first
        const cachedData = getTtlCache(cacheKey);
        if (cachedData) {
            setDashboardData({
                discCount: cachedData.discCount || 0,
                courseCount: cachedData.courseCount || 0,
                lastTwoRounds: cachedData.lastTwoRounds || []
            });
            setIsLoading(false);
        }

        // Set up subscriptions with optimized callbacks
        const unsubscribeDiscs = subscribeToUserDiscs(userId, (discs) => {
            updateDiscCount(discs.length);
            if (!cachedData) setIsLoading(false);
        });

        const unsubscribeCourses = subscribeToCourses(userId, (courses) => {
            updateCourseCount(courses.length);
            if (!cachedData) setIsLoading(false);
        });

        const unsubscribeRounds = subscribeToRounds(userId, (rounds) => {
            updateLastTwoRounds(rounds);
            if (!cachedData) setIsLoading(false);
        });

        return () => {
            unsubscribeDiscs();
            unsubscribeCourses();
            unsubscribeRounds();
        };
    }, [userId, cacheKey, updateDiscCount, updateCourseCount, updateLastTwoRounds]);

    // Memoized round click handler
    const handleRoundClick = useCallback((roundId) => {
        if (onNavigate) {
            onNavigate('scores', { roundId });
        } else {
            console.warn("onNavigate prop not provided to HomePage.");
        }
    }, [onNavigate]);

    // Memoized summary card props to prevent re-renders
    const summaryCards = useMemo(() => [
        {
            icon: <Circle size={24} className="text-blue-600 dark:text-blue-300" />,
            title: "In Your Bag",
            value: animatedDiscCount,
            unit: "Discs"
        },
        {
            icon: <Map size={24} className="text-blue-600 dark:text-blue-300" />,
            title: "Courses Created",
            value: animatedCourseCount,
            unit: "Courses"
        }
    ], [animatedDiscCount, animatedCourseCount]);

    // Memoized recent rounds section
    const recentRoundsSection = useMemo(() => {
        if (dashboardData.lastTwoRounds.length === 0) {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        You haven't played any rounds yet. Go import a scorecard!
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {dashboardData.lastTwoRounds.map(round => (
                    <div
                        key={round.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => handleRoundClick(round.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {round.courseName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {round.layoutName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                        {round.totalScore}
                                    </p>
                                    <p className={`text-lg font-semibold ${round.scoreToPar >= 0 ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                        {formatScoreToPar(round.scoreToPar)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [dashboardData.lastTwoRounds, handleRoundClick, formatScoreToPar]);

    // Early return for loading state
    if (isLoading) {
        return (
            <div className="text-center p-8 text-gray-700 dark:text-gray-300">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black pb-48">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-black py-10 sm:py-12 lg:py-16">
                <style>{`
                    @keyframes drawPath1 { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
                    @keyframes drawPath2 { from { stroke-dashoffset: 350; } to { stroke-dashoffset: 0; } }
                    @keyframes drawPath3 { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
                    .path-animate-1 { stroke-dasharray: 300; stroke-dashoffset: 300; animation: drawPath1 2s ease-out forwards; }
                    .path-animate-2 { stroke-dasharray: 350; stroke-dashoffset: 350; animation: drawPath2 2.5s ease-out forwards 0.5s; }
                    .path-animate-3 { stroke-dasharray: 200; stroke-dashoffset: 200; animation: drawPath3 1.8s ease-out forwards 1s; }
                `}</style>
                <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10 pointer-events-none" aria-hidden="true">
                    <defs>
                        <linearGradient id="gradient-path" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" className="text-blue-400 dark:text-blue-600" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" className="text-orange-400 dark:text-orange-600" />
                        </linearGradient>
                    </defs>
                    <path d="M0 50 Q 25 20, 50 50 T 100 50" stroke="url(#gradient-path)" strokeWidth="3" fill="none" transform="scale(3) translate(0,-15)" className="path-animate-1" />
                    <path d="M0 80 C 20 60, 40 100, 60 80 S 100 60, 120 80" stroke="url(#gradient-path)" strokeWidth="2.5" fill="none" transform="scale(2.5) translate(10, -40)" className="path-animate-2" />
                    <path d="M0 20 Q 20 0, 40 20 T 80 20" stroke="url(#gradient-path)" strokeWidth="2" fill="none" transform="scale(4) translate(-10, 20)" className="path-animate-3" />
                </svg>

                <div className="relative z-10 max-w-sm mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Your Flight<span className='text-blue-600'>Log</span> Dashboard
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        Welcome to your FlightLog dashboard! Here you can quickly see your disc golf stats at a glance.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 -mt-8 relative z-20">
                {/* Summary Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {summaryCards.map((card, index) => (
                        <SummaryCard
                            key={index}
                            icon={card.icon}
                            title={card.title}
                            value={card.value}
                            unit={card.unit}
                        />
                    ))}
                </div>

                {/* Recent Rounds Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
                        <ListChecks size={22} className="mr-3 text-blue-600 dark:text-blue-400" />
                        Recent Rounds
                    </h3>
                    {recentRoundsSection}
                </div>
            </div>
        </div>
    );
}