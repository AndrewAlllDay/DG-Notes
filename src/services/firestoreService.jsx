// src/services/firestoreService.jsx

import { db } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc, // <-- This function
    query,
    orderBy,
    onSnapshot,
    arrayUnion,
    runTransaction
} from 'firebase/firestore';

export const subscribeToCourses = (callback, userId) => {
    if (!userId) {
        console.warn("No userId provided for course subscription. User is likely logged out.");
        callback([]);
        return () => { };
    }

    const coursesCollectionRef = collection(db, 'users', userId, 'courses');
    const q = query(coursesCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const courses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                holes: data.holes ? [...data.holes].sort((a, b) => a.number - b.number) : [],
            };
        });
        callback(courses);
    }, (error) => {
        console.error("Error subscribing to courses:", error);
    });

    return unsubscribe;
};


export const addCourse = async (courseName, tournamentName, userId) => {
    if (!userId) throw new Error("User ID is required to add a course.");
    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'courses'), {
            name: courseName,
            tournamentName: tournamentName || '',
            holes: [],
            createdAt: new Date(),
        });
        console.log("Course added with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding course: ", e);
        throw e;
    }
};

export const deleteCourse = async (courseId, userId) => {
    // --- CONSOLE.LOG ADDED HERE FOR DEBUGGING ---
    console.log("firestoreService.jsx: deleteCourse called for courseId:", courseId, "with userId:", userId);
    // --- END CONSOLE.LOG ---
    if (!userId) throw new Error("User ID is required to delete a course.");
    try {
        await deleteDoc(doc(db, 'users', userId, 'courses', courseId));
        console.log("Course successfully deleted!");
    } catch (e) {
        console.error("Error deleting course: ", e);
        throw e;
    }
};

export const addHoleToCourse = async (courseId, newHole, userId) => {
    if (!userId) throw new Error("User ID is required to add a hole.");
    try {
        const courseRef = doc(db, 'users', userId, 'courses', courseId);
        await updateDoc(courseRef, {
            holes: arrayUnion(newHole)
        });
        console.log("Hole added to course successfully!");
    } catch (e) {
        console.error("Error adding hole to course: ", e);
        throw e;
    }
};

export const updateHoleInCourse = async (courseId, holeIdToUpdate, updatedHoleData, userId) => {
    if (!userId) throw new Error("User ID is required to update a hole.");
    const courseRef = doc(db, 'users', userId, 'courses', courseId);

    try {
        await runTransaction(db, async (transaction) => {
            const courseDoc = await transaction.get(courseRef);
            if (!courseDoc.exists()) {
                throw new Error("Course does not exist!");
            }

            const currentHoles = courseDoc.data().holes || [];
            const updatedHoles = currentHoles.map(hole =>
                hole.id === holeIdToUpdate
                    ? { ...hole, ...updatedHoleData }
                    : hole
            );

            transaction.update(courseRef, { holes: updatedHoles });
        });
        console.log("Hole successfully updated!");
    } catch (e) {
        console.error("Error updating hole in course: ", e);
        throw e;
    }
};

export const deleteHoleFromCourse = async (courseId, holeIdToDelete, userId) => {
    if (!userId) throw new Error("User ID is required to delete a hole.");
    const courseRef = doc(db, 'users', userId, 'courses', courseId);

    try {
        await runTransaction(db, async (transaction) => {
            const courseDoc = await transaction.get(courseRef);
            if (!courseDoc.exists()) {
                throw new Error("Course does not exist!");
            }

            const currentHoles = courseDoc.data().holes || [];
            const updatedHoles = currentHoles.filter(hole => hole.id !== holeIdToDelete);

            transaction.update(courseRef, { holes: updatedHoles });
        });
        console.log("Hole successfully deleted from course!");
    } catch (e) {
        console.error("Error deleting hole from course: ", e);
        throw e;
    }
};

export const reorderHolesInCourse = async (courseId, reorderedHolesArray, userId) => {
    if (!userId) throw new Error("User ID is required to reorder holes.");
    try {
        const courseRef = doc(db, 'users', userId, 'courses', courseId);
        await updateDoc(courseRef, {
            holes: reorderedHolesArray
        });
        console.log("Holes reordered successfully!");
    } catch (e) {
        console.error("Error reordering holes:", e);
        throw e;
    }
};