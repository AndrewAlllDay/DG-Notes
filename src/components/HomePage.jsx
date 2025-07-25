import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase';
import { subscribeToUserDiscs } from '../services/firestoreService';
import { subscribeToCourses } from '../services/firestoreService';
import { subscribeToRounds } from '../services/firestoreService';
import { format } from 'date-fns';
import { Circle, Map, ListChecks } from 'lucide-react';

// A reusable summary card component for the dashboard
const SummaryCard = ({ icon, title, value, unit }) => (
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
);

export default function HomePage({ onNavigate }) {
    const { userId } = useFirebase();
    const [discCount, setDiscCount] = useState(0);
    const [courseCount, setCourseCount] = useState(0);
    const [lastTwoRounds, setLastTwoRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        // Subscribe to all discs (active and archived) to get a total count
        const unsubscribeDiscs = subscribeToUserDiscs(userId, (discs) => {
            setDiscCount(discs.length);
        });

        // Subscribe to courses to get a total count
        const unsubscribeCourses = subscribeToCourses(userId, (courses) => {
            setCourseCount(courses.length);
        });

        // Subscribe to rounds and get the last two
        const unsubscribeRounds = subscribeToRounds(userId, (rounds) => {
            // The rounds are already sorted by date in the service, so we just take the first two
            setLastTwoRounds(rounds.slice(0, 2));
            setIsLoading(false);
        });

        // Cleanup subscriptions on component unmount
        return () => {
            unsubscribeDiscs();
            unsubscribeCourses();
            unsubscribeRounds();
        };
    }, [userId]);

    const formatScoreToPar = (score) => {
        if (score === 0) return 'E';
        if (score > 0) return `+${score}`;
        return score;
    };

    const handleRoundClick = (roundId) => {
        if (onNavigate) {
            onNavigate('scores', { roundId: roundId });
        } else {
            console.warn("onNavigate prop not provided to HomePage. Cannot navigate to scores.");
        }
    };

    if (isLoading) {
        return <div className="text-center p-8 text-gray-700 dark:text-gray-300">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black">
            {/* NEW: Hero Section with Flight Path Lines */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-black py-10 sm:py-12 lg:py-16">
                {/* NEW: Style block for animation */}
                <style>
                    {`
                    @keyframes drawPath1 {
                        from {
                            stroke-dashoffset: 300; /* Estimated length for path 1 */
                        }
                        to {
                            stroke-dashoffset: 0;
                        }
                    }
                    @keyframes drawPath2 {
                        from {
                            stroke-dashoffset: 350; /* Estimated length for path 2 */
                        }
                        to {
                            stroke-dashoffset: 0;
                        }
                    }
                    @keyframes drawPath3 {
                        from {
                            stroke-dashoffset: 200; /* Estimated length for path 3 */
                        }
                        to {
                            stroke-dashoffset: 0;
                        }
                    }

                    .path-animate-1 {
                        stroke-dasharray: 300; /* Must match 'from' value */
                        stroke-dashoffset: 300;
                        animation: drawPath1 2s ease-out forwards;
                    }
                    .path-animate-2 {
                        stroke-dasharray: 350;
                        stroke-dashoffset: 350;
                        animation: drawPath2 2.5s ease-out forwards 0.5s; /* Delay for staggered effect */
                    }
                    .path-animate-3 {
                        stroke-dasharray: 200;
                        stroke-dashoffset: 200;
                        animation: drawPath3 1.8s ease-out forwards 1s; /* Delay for staggered effect */
                    }
                    `}
                </style>
                {/* Subtle SVG flight path lines in the background */}
                <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10 pointer-events-none" aria-hidden="true">
                    <defs>
                        <linearGradient id="gradient-path" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.7" className="text-blue-400 dark:text-blue-600" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" className="text-orange-400 dark:text-orange-600" />
                        </linearGradient>
                    </defs>
                    {/* Example curved lines - MODIFIED: Adjusted translate Y values to move lines up */}
                    <path d="M0 50 Q 25 20, 50 50 T 100 50" stroke="url(#gradient-path)" strokeWidth="3" fill="none" transform="scale(3) translate(0,-15)" className="path-animate-1" />
                    <path d="M0 80 C 20 60, 40 100, 60 80 S 100 60, 120 80" stroke="url(#gradient-path)" strokeWidth="2.5" fill="none" transform="scale(2.5) translate(10, -40)" className="path-animate-2" />
                    <path d="M0 20 Q 20 0, 40 20 T 80 20" stroke="url(#gradient-path)" strokeWidth="2" fill="none" transform="scale(4) translate(-10, 20)" className="path-animate-3" />
                </svg>

                <div className="relative z-10 max-w-sm mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">Your Flight<span className='text-blue-600'>Log</span> Dashboard</h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                        Welcome to your FlightLog dashboard! Here you can quickly see your disc golf stats at a glance,
                        including your disc collection, courses played, and recent round scores.
                    </p>
                </div>
            </div>
            {/* END NEW: Hero Section */}

            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 -mt-8 relative z-20">
                {/* Summary Cards Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <SummaryCard
                        icon={<Circle size={24} className="text-blue-600 dark:text-blue-300" />}
                        title="In Your Bag"
                        value={discCount}
                        unit="Discs"
                    />
                    <SummaryCard
                        icon={<Map size={24} className="text-blue-600 dark:text-blue-300" />}
                        title="Courses Created"
                        value={courseCount}
                        unit="Courses"
                    />
                </div>

                {/* Recent Rounds Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
                        <ListChecks size={22} className="mr-3 text-blue-600 dark:text-blue-400" />
                        Recent Rounds
                    </h3>
                    {lastTwoRounds.length > 0 ? (
                        <div className="space-y-4">
                            {lastTwoRounds.map(round => (
                                <div
                                    key={round.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                    onClick={() => handleRoundClick(round.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">{round.courseName}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{round.layoutName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                                <p className={`text-lg font-semibold ${round.scoreToPar >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {formatScoreToPar(round.scoreToPar)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                            <p className="text-gray-600 dark:text-gray-400">You haven't played any rounds yet. Go import a scorecard!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
