// src/services/firestoreService.js
import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    arrayUnion, // To add elements to an array field
    arrayRemove // To remove elements from an array field
} from 'firebase/firestore';

const COURSES_COLLECTION = 'courses';

// --- CREATE COURSE ---
export const addCourse = async (courseName, tournamentName) => {
    try {
        // Generate default 18 holes
        const defaultHoles = Array.from({ length: 18 }, (_, index) => ({
            // Use a combination of Date.now() and index for a more robust temporary ID
            // This is a client-side ID for holes *within* a course document.
            id: Date.now() + index,
            number: (index + 1).toString(),
            par: '3',
            note: '',
        }));

        const newCourseData = {
            name: courseName,
            tournamentName: tournamentName,
            holes: defaultHoles,
            createdAt: new Date(), // Add a timestamp for ordering
        };

        const docRef = await addDoc(collection(db, COURSES_COLLECTION), newCourseData);
        console.log("Course added with ID: ", docRef.id);
        return { id: docRef.id, ...newCourseData }; // Return the new course with its Firestore ID
    } catch (e) {
        console.error("Error adding course: ", e);
        throw e;
    }
};

// --- READ COURSES (Real-time listener) ---
// This is the preferred method for React to keep UI in sync
export const subscribeToCourses = (callback) => {
    // Order courses by their creation date, newest first
    const q = query(collection(db, COURSES_COLLECTION), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const courses = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(courses); // Call the provided callback with the updated courses
    }, (error) => {
        console.error("Error subscribing to courses: ", error);
        // You might want to pass this error to the callback too
    });

    return unsubscribe; // Return the unsubscribe function to clean up the listener
};

// --- UPDATE COURSE (e.g., updating course details or an entire holes array) ---
export const updateCourse = async (courseId, newData) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseDocRef, newData);
        console.log("Course updated successfully!");
    } catch (e) {
        console.error("Error updating course: ", e);
        throw e;
    }
};

// --- DELETE COURSE ---
export const deleteCourse = async (courseId) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        await deleteDoc(courseDocRef);
        console.log("Course deleted successfully!");
    } catch (e) {
        console.error("Error deleting course: ", e);
        throw e;
    }
};

// --- HOLE-SPECIFIC OPERATIONS (within a course document) ---

// Add a hole to an existing course's 'holes' array
// This uses arrayUnion, which adds an element only if it's not already present.
// For hole objects, this means the entire object must be unique.
export const addHoleToCourse = async (courseId, holeData) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseDocRef, {
            holes: arrayUnion(holeData) // Add the new hole object to the 'holes' array
        });
        console.log("Hole added to course successfully!");
    } catch (e) {
        console.error("Error adding hole to course: ", e);
        throw e;
    }
};

// Update a specific hole within a course's 'holes' array
// This requires reading the document, updating the array in memory, then writing it back.
// This is because Firestore doesn't have direct array element update by index or partial object.
export const updateHoleInCourse = async (courseId, holeId, updatedHoleData) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        const courseSnapshot = await getDocs(query(collection(db, COURSES_COLLECTION))); // Fetch all courses
        const currentCourse = courseSnapshot.docs.find(doc => doc.id === courseId)?.data();

        if (currentCourse && currentCourse.holes) {
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

// Delete a specific hole from a course's 'holes' array
export const deleteHoleFromCourse = async (courseId, holeId) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        const courseSnapshot = await getDocs(query(collection(db, COURSES_COLLECTION))); // Fetch all courses
        const currentCourse = courseSnapshot.docs.find(doc => doc.id === courseId)?.data();

        if (currentCourse && currentCourse.holes) {
            const holeToRemove = currentCourse.holes.find(hole => hole.id === holeId);
            if (holeToRemove) {
                await updateDoc(courseDocRef, {
                    holes: arrayRemove(holeToRemove) // Remove the specific hole object from the array
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

// Reorder holes within a course's 'holes' array
// This replaces the entire 'holes' array with the new reordered array.
export const reorderHolesInCourse = async (courseId, reorderedHolesArray) => {
    try {
        const courseDocRef = doc(db, COURSES_COLLECTION, courseId);
        await updateDoc(courseDocRef, { holes: reorderedHolesArray });
        console.log("Holes reordered in course successfully!");
    } catch (e) {
        console.error("Error reordering holes:", e);
        throw e;
    }
};