// src/services/firestoreService.jsx
import { db, appId } from '../firebase'; // Import db and appId from firebase.js
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

// --- User Profile Management ---

/**
 * Sets or updates a user's profile in Firestore.
 * @param {string} userId The UID of the user.
 * @param {Object} data The profile data to set or update (e.g., { displayName: 'John Doe', role: 'admin' }).
 * @returns {Promise<void>}
 */
export const setUserProfile = async (userId, data) => {
    if (!userId) {
        console.error("Error: userId is undefined when trying to set user profile.");
        throw new Error("User ID is required to set profile.");
    }
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public');
    try {
        await setDoc(userProfileRef, data, { merge: true }); // Use merge: true to update existing fields or add new ones
        console.log(`User profile for ${userId} updated/created successfully.`);
    } catch (error) {
        console.error("Error setting user profile:", error);
        throw error;
    }
};

/**
 * Retrieves a user's profile from Firestore.
 * @param {string} userId The UID of the user.
 * @returns {Promise<Object|null>} The user's profile data, or null if not found.
 */
export const getUserProfile = async (userId) => {
    if (!userId) {
        console.error("Error: userId is undefined when trying to get user profile.");
        return null;
    }
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public');
    try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such user profile document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
};

/**
 * Subscribes to real-time updates for a single user's profile.
 * @param {string} userId The UID of the user.
 * @param {function(Object|null): void} callback Function to call with profile data on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToUserProfile = (userId, callback) => {
    if (!userId) {
        console.error("Error: userId is undefined when trying to subscribe to user profile.");
        callback(null);
        return () => { }; // Return a no-op unsubscribe
    }
    const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public');
    const unsubscribe = onSnapshot(userProfileRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to user profile:", error);
        callback(null); // Pass null on error
    });
    return unsubscribe;
};

/**
 * Subscribes to real-time updates for all public user profiles (display names).
 * This is used for lists where users can select recipients or see names.
 * @param {function(Array<Object>): void} callback Function to call with an array of public profile data on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToAllUserDisplayNames = (callback) => {
    const q = query(collection(db, `artifacts/${appId}/users`), where('profile.public', '!=', null));
    // Note: The above query works if the 'public' profile document itself exists.
    // For more robust querying on subcollections, you might need collection group queries
    // or restructuring, but for just getting display names, this should be okay.

    // A more direct way to get all public profiles if they are consistently named 'public' documents:
    const profilesRef = collection(db, `artifacts/${appId}/users`); // Point to the users collection

    const unsubscribe = onSnapshot(profilesRef, async (snapshot) => {
        const profiles = [];
        for (const userDoc of snapshot.docs) {
            const profileDocRef = doc(db, `artifacts/${appId}/users/${userDoc.id}/profile`, 'public');
            try {
                const profileSnap = await getDoc(profileDocRef);
                if (profileSnap.exists()) {
                    profiles.push({ id: profileSnap.id, ...profileSnap.data() });
                }
            } catch (error) {
                console.error(`Error fetching profile for user ${userDoc.id}:`, error);
            }
        }
        console.log("DEBUG firestoreService: Fetched all user display names (count):", profiles.length, "Profiles:", profiles);
        callback(profiles);
    }, (error) => {
        console.error("DEBUG firestoreService: Error subscribing to all user display names:", error);
        // Do not throw, just log and pass empty array or handle gracefully
        callback([]);
    });

    return unsubscribe;
};


/**
 * Subscribes to real-time updates for all user profiles, including private data.
 * Used by admin for role management.
 * @param {function(Array<Object>): void} callback Function to call with an array of all profile data on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToAllUserProfiles = (callback) => {
    // This query assumes public profile data is directly at `users/{userId}` for simplicity
    // If profiles are in a subcollection like `users/{userId}/profile/public`, the query needs adjustment
    const q = collection(db, `artifacts/${appId}/users`);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
        const userProfiles = [];
        for (const userDoc of snapshot.docs) {
            const userId = userDoc.id;
            const publicProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'public');
            try {
                const publicProfileSnap = await getDoc(publicProfileRef);
                if (publicProfileSnap.exists()) {
                    userProfiles.push({ id: userId, ...publicProfileSnap.data() });
                }
            } catch (error) {
                console.error(`Error fetching public profile for user ${userId}:`, error);
            }
        }
        callback(userProfiles);
    }, (error) => {
        console.error("Error subscribing to all user profiles:", error);
        callback([]);
    });

    return unsubscribe;
};


// --- Encouragement Notes ---

/**
 * Adds a new encouragement note to Firestore.
 * @param {string} senderId The UID of the sender.
 * @param {string} receiverId The UID of the receiver.
 * @param {string} senderDisplayName The display name of the sender.
 * @param {string} receiverDisplayName The display name of the receiver.
 * @param {string} messageText The actual message content of the note.
 * @returns {Promise<void>}
 */
export const addEncouragementNote = async (senderId, receiverId, senderDisplayName, receiverDisplayName, messageText) => {
    try {
        // FIX: Ensure 'noteText' field correctly stores 'messageText'
        await addDoc(collection(db, `artifacts/${appId}/public/encouragementNotes`), {
            senderId,
            receiverId,
            senderDisplayName,
            receiverDisplayName,
            noteText: messageText, // This is the crucial line for the fix
            read: false,
            timestamp: serverTimestamp(),
        });
        console.log("Encouragement note added successfully!");
    } catch (error) {
        console.error("Error adding encouragement note:", error);
        throw error;
    }
};

/**
 * Subscribes to unread encouragement notes for a specific receiver.
 * @param {string} receiverId The UID of the receiver.
 * @param {function(Array<Object>): void} callback Function to call with an array of unread notes on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToEncouragementNotes = (receiverId, callback) => {
    const q = query(
        collection(db, `artifacts/${appId}/public/encouragementNotes`),
        where('receiverId', '==', receiverId),
        where('read', '==', false),
        // orderBy('timestamp', 'asc') // Re-added orderBy, but ensure you have an index for it if it causes issues
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("DEBUG: Fetched unread encouragement notes:", notes);
        callback(notes);
    }, (error) => {
        console.error("Error subscribing to encouragement notes:", error);
        callback([]); // Pass empty array on error
    });
    return unsubscribe;
};

/**
 * Marks an encouragement note as read.
 * @param {string} noteId The ID of the note document.
 * @param {string} receiverId The UID of the receiver (for security rule validation).
 * @returns {Promise<void>}
 */
export const markEncouragementNoteAsRead = async (noteId, receiverId) => {
    const noteRef = doc(db, `artifacts/${appId}/public/encouragementNotes`, noteId);
    try {
        // Only allow update if the receiverId matches (via Firestore security rules)
        await updateDoc(noteRef, {
            read: true
        });
        console.log(`Note ${noteId} marked as read.`);
    } catch (error) {
        console.error(`Error marking note ${noteId} as read:`, error);
        throw error;
    }
};

// --- Course Management ---

/**
 * Adds a new course to Firestore.
 * @param {string} userId The UID of the user who owns the course.
 * @param {Object} courseData The data for the course (e.g., { name: 'My Course', location: 'City' }).
 * @returns {Promise<string>} The ID of the newly added course.
 */
export const addCourse = async (userId, courseData) => {
    if (!userId) {
        throw new Error("User ID is required to add a course.");
    }
    try {
        const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/courses`), {
            ...courseData,
            createdAt: serverTimestamp() // Add a timestamp
        });
        console.log("Course added with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding course: ", e);
        throw e;
    }
};

/**
 * Subscribes to real-time updates for a user's courses.
 * @param {string} userId The UID of the user.
 * @param {function(Array<Object>): void} callback Function to call with an array of course data on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToCourses = (userId, callback) => {
    if (!userId) {
        console.log("Auth not ready or userId not available, skipping course subscription.");
        callback([]); // Return empty array if no user
        return () => { };
    }
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/courses`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const courses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("Fetched courses in Courses.jsx:", courses);
        callback(courses);
    }, (error) => {
        console.error("Error subscribing to courses:", error);
        callback([]); // Pass empty array on error
    });
    return unsubscribe;
};

/**
 * Updates an existing course in Firestore.
 * @param {string} userId The UID of the user who owns the course.
 * @param {string} courseId The ID of the course to update.
 * @param {Object} updatedData The data to update the course with.
 * @returns {Promise<void>}
 */
export const updateCourse = async (userId, courseId, updatedData) => {
    if (!userId || !courseId) {
        throw new Error("User ID and Course ID are required to update a course.");
    }
    const courseRef = doc(db, `artifacts/${appId}/users/${userId}/courses`, courseId);
    try {
        await updateDoc(courseRef, updatedData);
        console.log(`Course ${courseId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating course ${courseId}:`, error);
        throw error;
    }
};

/**
 * Deletes a course from Firestore.
 * @param {string} userId The UID of the user who owns the course.
 * @param {string} courseId The ID of the course to delete.
 * @returns {Promise<void>}
 */
export const deleteCourse = async (userId, courseId) => {
    if (!userId || !courseId) {
        throw new Error("User ID and Course ID are required to delete a course.");
    }
    const courseRef = doc(db, `artifacts/${appId}/users/${userId}/courses`, courseId);
    try {
        await deleteDoc(courseRef);
        console.log(`Course ${courseId} deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting course ${courseId}:`, error);
        throw error;
    }
};


// --- Hole Management (Subcollection of Courses) ---

/**
 * Adds a new hole to a specific course in Firestore.
 * @param {string} userId The UID of the user who owns the course.
 * @param {string} courseId The ID of the course to add the hole to.
 * @param {Object} holeData The data for the hole (e.g., { holeNumber: 1, par: 3 }).
 * @returns {Promise<string>} The ID of the newly added hole.
 */
export const addHole = async (userId, courseId, holeData) => {
    if (!userId || !courseId) {
        throw new Error("User ID and Course ID are required to add a hole.");
    }
    try {
        const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/courses/${courseId}/holes`), {
            ...holeData,
            createdAt: serverTimestamp() // Add a timestamp
        });
        console.log("Hole added with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding hole: ", e);
        throw e;
    }
};

/**
 * Subscribes to real-time updates for holes of a specific course.
 * @param {string} userId The UID of the user.
 * @param {string} courseId The ID of the course.
 * @param {function(Array<Object>): void} callback Function to call with an array of hole data on changes.
 * @returns {function(): void} An unsubscribe function.
 */
export const subscribeToHoles = (userId, courseId, callback) => {
    if (!userId || !courseId) {
        console.log("Auth not ready or userId/courseId not available, skipping hole subscription.");
        callback([]); // Return empty array if no user or course
        return () => { };
    }
    const q = query(collection(db, `artifacts/${appId}/users/${userId}/courses/${courseId}/holes`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const holes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log("Fetched holes for course:", courseId, holes);
        callback(holes);
    }, (error) => {
        console.error("Error subscribing to holes:", error);
        callback([]); // Pass empty array on error
    });
    return unsubscribe;
};

/**
 * Updates an existing hole in Firestore.
 * @param {string} userId The UID of the user.
 * @param {string} courseId The ID of the course.
 * @param {string} holeId The ID of the hole to update.
 * @param {Object} updatedData The data to update the hole with.
 * @returns {Promise<void>}
 */
export const updateHole = async (userId, courseId, holeId, updatedData) => {
    if (!userId || !courseId || !holeId) {
        throw new Error("User ID, Course ID, and Hole ID are required to update a hole.");
    }
    const holeRef = doc(db, `artifacts/${appId}/users/${userId}/courses/${courseId}/holes`, holeId);
    try {
        await updateDoc(holeRef, updatedData);
        console.log(`Hole ${holeId} updated successfully.`);
    } catch (error) {
        console.error(`Error updating hole ${holeId}:`, error);
        throw error;
    }
};

/**
 * Deletes a hole from Firestore.
 * @param {string} userId The UID of the user.
 * @param {string} courseId The ID of the course.
 * @param {string} holeId The ID of the hole to delete.
 * @returns {Promise<void>}
 */
export const deleteHole = async (userId, courseId, holeId) => {
    if (!userId || !courseId || !holeId) {
        throw new Error("User ID, Course ID, and Hole ID are required to delete a hole.");
    }
    const holeRef = doc(db, `artifacts/${appId}/users/${userId}/courses/${courseId}/holes`, holeId);
    try {
        await deleteDoc(holeRef);
        console.log(`Hole ${holeId} deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting hole ${holeId}:`, error);
        throw error;
    }
};
