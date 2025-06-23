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
            userId: userId,
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


// --- NEW ENCOURAGEMENT NOTE FUNCTIONS ---

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
