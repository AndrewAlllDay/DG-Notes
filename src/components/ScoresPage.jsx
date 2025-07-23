// src/components/ScoresPage.jsx
import React, { useState, useEffect } from 'react';
import { useFirebase } from '../firebase.js';
import { subscribeToRounds } from '../services/firestoreService.jsx';
import { format, isSameDay } from 'date-fns';

export default function ScoresPage() {
    const { userId, isAuthReady } = useFirebase();
    const [rounds, setRounds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) return;

        if (userId) {
            setIsLoading(true);
            const unsubscribe = subscribeToRounds(userId, (fetchedRounds) => {
                // --- Start of Deduplication Logic ---
                const uniqueRoundsMap = new Map(); // Key: `${courseName}-${layoutName}-${dateFormatted}`
                // Value: the round object

                fetchedRounds.forEach(round => {
                    // Ensure round.date is a Date object for isSameDay comparison
                    const roundDate = round.date?.toDate ? round.date.toDate() : null;

                    if (roundDate) {
                        // Create a unique key for each round based on course, layout, and date
                        // Use format(date, 'yyyy-MM-dd') to only consider the day, month, and year
                        const dateKey = format(roundDate, 'yyyy-MM-dd');
                        const uniqueKey = `${round.courseName || ''}-${round.layoutName || ''}-${dateKey}`;

                        // If this key hasn't been seen before, add the round to the map
                        if (!uniqueRoundsMap.has(uniqueKey)) {
                            uniqueRoundsMap.set(uniqueKey, round);
                        }
                        // Optional: If you want to keep the "latest" score for a given day/course/layout,
                        // you could add logic here to compare totalScore or timestamp and replace
                        // if the new round is "better" or more recent. For now, it keeps the first one it encounters.
                    } else {
                        // If date is missing/invalid, you might still want to add it
                        // or handle it differently. For simplicity, we'll just add unique by ID.
                        uniqueRoundsMap.set(round.id, round); // Fallback to ID uniqueness
                    }
                });

                // Convert the Map values back to an array
                const deduplicatedRounds = Array.from(uniqueRoundsMap.values());

                // Sort the deduplicated rounds (e.g., by date descending)
                deduplicatedRounds.sort((a, b) => {
                    const dateA = a.date?.toDate ? a.date.toDate() : new Date(0); // Handle potentially missing dates
                    const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });

                setRounds(deduplicatedRounds);
                // --- End of Deduplication Logic ---
                setIsLoading(false);
            });
            return () => unsubscribe();
        } else {
            setRounds([]);
            setIsLoading(false);
        }
    }, [userId, isAuthReady]);

    const formatScoreToPar = (score) => {
        if (score === 0) return 'E';
        if (score > 0) return `+${score}`;
        return score;
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading scores...</div>;
    }

    return (
        <div className="max-h-screen bg-gray-100 dark:bg-black p-4 pb-36 overflow-y-auto">            <h2 className="text-2xl font-bold mb-6 text-center pt-5 text-gray-800 dark:text-gray-100">My Scores</h2>

            {rounds.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">You haven't imported any scores yet.</p>
            ) : (
                <div className="max-w-2xl mx-auto space-y-4">
                    {rounds.map(round => (
                        <div key={round.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">{round.courseName}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{round.layoutName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                        {round.date?.toDate ? format(round.date.toDate(), 'MMMM d, yyyy') : 'N/A Date'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{round.totalScore}</p>
                                    <p className={`text-lg font-semibold ${round.scoreToPar === 0 ? 'text-gray-500' : round.scoreToPar > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatScoreToPar(round.scoreToPar)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}