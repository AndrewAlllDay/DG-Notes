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

export default function HomePage() {
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

    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black p-4 sm:p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-center pt-5 mb-6 text-gray-800 dark:text-white">Dashboard</h2>

            <div className="max-w-4xl mx-auto">
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
                                <div key={round.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">{round.courseName}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{round.layoutName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                            <p className={`text-lg font-semibold ${round.scoreToPar >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {formatScoreToPar(round.scoreToPar)}
                                            </p>
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
