import { useState, useEffect } from 'react';
import { subscribeToAllTeams } from '../services/firestoreService';
import { getCache, setCache } from '../utilities/cache';

/**
 * A custom hook for admins to get a real-time list of all teams.
 * Handles caching for faster initial loads.
 * @returns {Array} The list of teams.
 */
export const useAdminTeams = () => {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        // Attempt to load from cache immediately for a better user experience
        const cachedTeams = getCache('allTeams');
        if (cachedTeams) {
            setTeams(cachedTeams);
        }

        // Set up the real-time subscription to Firestore
        const unsubscribe = subscribeToAllTeams((fetchedTeams) => {
            setTeams(fetchedTeams);
            // Update the cache with fresh data whenever it changes
            setCache('allTeams', fetchedTeams);
        });

        // Clean up the subscription when the component that uses this hook unmounts
        return () => unsubscribe();
    }, []); // Empty dependency array means this effect runs only once on mount

    return teams;
};