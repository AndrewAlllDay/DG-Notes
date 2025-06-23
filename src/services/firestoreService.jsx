// src/services/firestoreService.js
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
} from 'firebase/firestore';

// IMPORTANT: Ensure appId is imported correctly from firebase.js
import { appId } from '../firebase';

// Function to get the user-specific courses collection path
const getUserCoursesCollection = (userId) => {
    if (!userId) {
        console.error("Attempted to access Firestore collection without a userId.");
        throw new Error("User not authenticated or userId is missing.");
    }
    // Assuming a collection structure like artifacts/app_id/users/user_id/courses
    return collection(db, `artifacts/${appId}/users/${userId}/courses`);
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
