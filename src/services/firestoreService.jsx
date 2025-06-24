// src/services/firestoreService.jsx
import { db } from '../firebase';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    getDoc,
    setDoc, // Import setDoc for user profiles
    where // Import 'where' for querying
} from 'firebase/firestore';

import { appId } from '../firebase';

// Function to get the user-specific courses collection path
const getUserCoursesCollection = (userId) => {
    if (!userId) {
        console.error("Attempted to access Firestore collection without a userId.");
        throw new Error("User not authenticated or userId is missing.");
    }
    return collection(db, `artifacts/${appId}/users/${userId}/courses`);
};

// Function to get the encouragement notes collection path
const getEncouragementNotesCollection = () => {
    return collection(db, `artifacts/${appId}/encouragement_notes`);
};

// Function to get the user profiles collection path
const getUserProfilesCollection = () => {
    return collection(db, `artifacts/${appId}/user_profiles`);
};

// --- USER PROFILE MANAGEMENT ---

/**
 * Sets or updates a user's profile data in Firestore.
 * This is used for both initial profile creation (e.g., after registration)
 * and subsequent updates (e.g., changing display name, setting role by admin).
 * @param {string} userId - The UID of the user.
 * @param {Object} profileData - The data to set/update in the user's profile document.
 * @returns {Promise<void>}
 */
export const setUserProfile = async (userId, profileData) => {
    try {
        if (!userId) {
            throw new Error("Cannot set user profile: User ID is missing.");
        }
        const profileDocRef = doc(getUserProfilesCollection(), userId);
        await setDoc(profileDocRef, profileData, { merge: true }); // Use merge: true to avoid overwriting existing fields
        console.log(`User profile for ${userId} updated/created successfully.`);
    } catch (e) {
        console.error("Error setting user profile: ", e);
        throw e;
    }
};

/**
 * Gets a single user's profile data.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<Object|null>} The user's profile data, or null if not found.
 */
export const getUserProfile = async (userId) => {
    try {
        if (!userId) {
            console.warn("Attempted to get user profile without a userId.");
            return null;
        }
        const profileDocRef = doc(getUserProfilesCollection(), userId);
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("DEBUG firestoreService: User profile does not exist for userId:", userId);
            return null;
        }
    } catch (e) {
        console.error("Error getting user profile: ", e);
        throw e;
    }
};

/**
 * Subscribes to real-time updates for a specific user's profile.
 * @param {string} userId - The UID of the user.
 * @param {function} callback - Callback function to receive the profile data.
 * @returns {function} An unsubscribe function.
 */
export const subscribeToUserProfile = (userId, callback) => {
    if (!userId) {
        console.warn("Attempted to subscribe to user profile without a userId.");
        callback(null);
        return () => { };
    }
    const profileDocRef = doc(getUserProfilesCollection(), userId);
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to user profile: ", error);
    });
    return unsubscribe;
};

/**
 * Subscribes to real-time updates for ALL user profiles (primarily for admin view).
 * This function typically requires more permissive security rules.
 * @param {function} callback - Callback function to receive an array of all user profile data.
 * @returns {function} An unsubscribe function.
 */
export const subscribeToAllUserProfiles = (callback) => {
    const q = query(getUserProfilesCollection(), orderBy('displayName', 'asc')); // Order by display name
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const profiles = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("DEBUG firestoreService: Fetched all user profiles (count):", profiles.length, "Profiles:", profiles);
        callback(profiles);
    }, (error) => {
        console.error("DEBUG firestoreService: Error subscribing to all user profiles: ", error);
    });
    return unsubscribe;
};


/**
 * NEW: Subscribes to real-time updates for a PUBLIC list of all user display names and UIDs.
 * This function should have more relaxed security rules to allow any authenticated user to read it.
 * It fetches only the necessary fields to display a list of recipients.
 * @param {function} callback - Callback function to receive an array of simplified user profile data ({id, displayName, email}).
 * @returns {function} An unsubscribe function.
 */
export const subscribeToAllUserDisplayNames = (callback) => {
    const q = query(getUserProfilesCollection(), orderBy('displayName', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const profiles = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                displayName: data.displayName || 'Unnamed User', // Provide a fallback
                email: data.email || 'Email not available' // Include email as well
            };
        });
        console.log("DEBUG firestoreService: Fetched all user display names (count):", profiles.length, "Profiles:", profiles);
        callback(profiles);
    }, (error) => {
        console.error("DEBUG firestoreService: Error subscribing to all user display names: ", error);
    });
    return unsubscribe;
};


// --- COURSE MANAGEMENT ---

// --- CREATE COURSE ---
export const addCourse = async (courseName, tournamentName, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot add course: User ID is missing.");
        }

        const defaultHoles = Array.from({ length: 18 }, (_, index) => ({
            id: `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
            number: (index + 1).toString(),
            par: '3',
            note: '',
        }));

        const newCourseData = {
            name: courseName,
            tournamentName: tournamentName,
            holes: defaultHoles,
            createdAt: new Date(),
            userId: userId, // Add the userId to the document to match security rules
        };

        const docRef = await addDoc(getUserCoursesCollection(userId), newCourseData);
        console.log("Course added with ID: ", docRef.id);
        return { id: docRef.id, ...newCourseData };
    } catch (e) {
        console.error("Error adding course: ", e);
        throw e;
    }
};

// --- READ COURSES (Real-time listener) ---
export const subscribeToCourses = (userId, callback) => {
    if (!userId) {
        console.warn("Attempted to subscribe to courses without a userId. Returning no courses.");
        callback([]);
        return () => { };
    }

    const q = query(getUserCoursesCollection(userId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const courses = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(courses);
    }, (error) => {
        console.error("Error subscribing to courses: ", error);
    });

    return unsubscribe;
};

// --- UPDATE COURSE ---
export const updateCourse = async (courseId, newData, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot update course: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        await updateDoc(courseDocRef, newData);
        console.log("Course updated successfully!");
    } catch (e) {
        console.error("Error updating course: ", e);
        throw e;
    }
};

// --- DELETE COURSE ---
export const deleteCourse = async (courseId, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot delete course: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        await deleteDoc(courseDocRef);
        console.log("Course deleted successfully!");
    } catch (e) {
        console.error("Error deleting course: ", e);
        throw e;
    }
};

// --- HOLE-SPECIFIC OPERATIONS ---
export const addHoleToCourse = async (courseId, holeData, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot add hole: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        await updateDoc(courseDocRef, {
            holes: arrayUnion(holeData)
        });
        console.log("Hole added to course successfully!");
    } catch (e) {
        console.error("Error adding hole to course: ", e);
        throw e;
    }
};

export const updateHoleInCourse = async (courseId, holeId, updatedHoleData, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot update hole: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        const courseSnapshot = await getDoc(courseDocRef);

        if (courseSnapshot.exists() && courseSnapshot.data().holes) {
            const currentCourse = courseSnapshot.data();
            const updatedHoles = currentCourse.holes.map(hole =>
                hole.id === holeId ? { ...hole, ...updatedHoleData } : hole
            );
            await updateDoc(courseDocRef, { holes: updatedHoles });
            console.log("Hole updated in course successfully!");
        } else {
            console.warn("Course or holes array not found for update:", courseId);
        }
    } catch (e) {
        console.error("Error updating hole in course: ", e);
        throw e;
    }
};

export const deleteHoleFromCourse = async (courseId, holeId, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot delete hole: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        const courseSnapshot = await getDoc(courseDocRef);

        if (courseSnapshot.exists() && courseSnapshot.data().holes) {
            const currentCourse = courseSnapshot.data();
            const holeToRemove = currentCourse.holes.find(hole => hole.id === holeId);
            if (holeToRemove) {
                await updateDoc(courseDocRef, {
                    holes: arrayRemove(holeToRemove)
                });
                console.log("Hole deleted from course successfully!");
            } else {
                console.warn("Hole not found in course for deletion:", holeId);
            }
        } else {
            console.warn("Course or holes array not found for hole deletion:", courseId);
        }
    } catch (e) {
        console.error("Error deleting hole from course: ", e);
        throw e;
    }
};

export const reorderHolesInCourse = async (courseId, reorderedHolesArray, userId) => {
    try {
        if (!userId) {
            throw new Error("Cannot reorder holes: User ID is missing.");
        }
        const courseDocRef = doc(getUserCoursesCollection(userId), courseId);
        await updateDoc(courseDocRef, { holes: reorderedHolesArray });
        console.log("Holes reordered in course successfully!");
    } catch (e) {
        console.error("Error reordering holes:", e);
        throw e;
    }
};


// --- ENCOURAGEMENT NOTE FUNCTIONS ---

/**
 * Adds an encouragement note to Firestore.
 * @param {string} senderId - The UID of the user sending the note.
 * @param {string} receiverId - The UID of the user receiving the note.
 * @param {string} noteText - The encouragement message.
 * @returns {Promise<Object>} A promise that resolves with the new note's ID and data.
 */
export const addEncouragementNote = async (senderId, receiverId, noteText) => {
    try {
        if (!senderId || !receiverId || !noteText) {
            throw new Error("Sender ID, Receiver ID, and Note Text are required.");
        }

        const newNoteData = {
            senderId: senderId,
            receiverId: receiverId,
            noteText: noteText,
            timestamp: new Date(), // Use Firestore timestamp
            read: false, // Mark as unread by default
        };

        const docRef = await addDoc(getEncouragementNotesCollection(), newNoteData);
        console.log("Encouragement note added with ID: ", docRef.id);
        return { id: docRef.id, ...newNoteData };
    } catch (e) {
        console.error("Error adding encouragement note: ", e);
        throw e;
    }
};

/**
 * Subscribes to real-time updates for unread encouragement notes for a specific user.
 * @param {string} receiverId - The UID of the user who should receive notes.
 * @param {function} callback - Callback function to receive notes (array of note objects).
 * @returns {function} An unsubscribe function to detach the listener.
 */
export const subscribeToEncouragementNotes = (receiverId, callback) => {
    if (!receiverId) {
        console.warn("Attempted to subscribe to encouragement notes without a receiverId.");
        callback([]);
        return () => { };
    }

    // Query for notes where the current user is the receiver AND the note is unread
    const q = query(
        getEncouragementNotesCollection(),
        where('receiverId', '==', receiverId),
        where('read', '==', false), // Only listen for unread notes
        orderBy('timestamp', 'asc') // Order by oldest unread note first
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("DEBUG: Fetched unread encouragement notes:", notes);
        callback(notes);
    }, (error) => {
        console.error("Error subscribing to encouragement notes: ", error);
        // You might want to handle this error in the callback or component
    });

    return unsubscribe;
};

/**
 * Marks a specific encouragement note as read.
 * @param {string} noteId - The ID of the note to mark as read.
 * @param {string} userId - The UID of the user marking it as read (must be the receiver).
 * @returns {Promise<void>} A promise that resolves when the note is updated.
 */
export const markEncouragementNoteAsRead = async (noteId, userId) => {
    try {
        if (!noteId || !userId) {
            throw new Error("Note ID and User ID are required to mark a note as read.");
        }
        // This relies on Firestore security rules to ensure only the receiver can update 'read'
        const noteDocRef = doc(getEncouragementNotesCollection(), noteId);
        await updateDoc(noteDocRef, { read: true });
        console.log(`Encouragement note ${noteId} marked as read by ${userId}.`);
    } catch (e) {
        console.error("Error marking encouragement note as read: ", e);
        throw e;
    }
};
