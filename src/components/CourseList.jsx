// src/components/CourseList.jsx

import React, { useState, useRef, useEffect } from 'react';
import CourseItem from './CourseItem';

export default function CourseList({ courses, onDeleteCourse, onSelectCourse, tournamentName }) {
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const swipingItemId = useRef(null);
    const hasSwipedEnough = useRef(false);
    const listRef = useRef(null); // Ref for the ul element to detect outside clicks

    // --- PARENT COMPONENT CONSOLE LOGS ---
    // console.log(`[CourseList] Current swipedCourseId: ${swipedCourseId}`); // Commented out to reduce console noise
    // --- END PARENT COMPONENT CONSOLE LOGS ---

    // Effect for handling clicks/touches outside the list to close a swiped item
    useEffect(() => {
        const handleClickOutside = (event) => {
            // If there's a swiped item, and the click target is NOT within the list (ul element itself)
            if (swipedCourseId && listRef.current && !listRef.current.contains(event.target)) {
                // console.log(`[CourseList] Clicked outside current swiped item (${swipedCourseId}). Closing.`); // Commented out
                setSwipedCourseId(null);
            }
        };

        // Add event listener to the window
        window.addEventListener('click', handleClickOutside);
        window.addEventListener('touchstart', handleClickOutside); // For touch devices

        return () => {
            // Clean up event listeners on component unmount
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('touchstart', handleClickOutside);
        };
    }, [swipedCourseId]); // Re-run effect when swipedCourseId changes

    const handleTouchStart = (e, id) => {
        // If a *different* item is already swiped open, close it before starting a new swipe
        if (swipedCourseId && swipedCourseId !== id) {
            setSwipedCourseId(null);
            // console.log(`[CourseList] Closing previous swiped item ${swipedCourseId} before new swipe on ${id}`); // Commented out
        }

        touchStartX.current = e.touches[0].clientX;
        swipingItemId.current = id;
        hasSwipedEnough.current = false; // Reset for the new swipe
        // console.log(`[CourseList] Touch Start on ${id}. Initial X: ${touchStartX.current}`); // Commented out
    };

    const handleTouchMove = (e, id) => {
        // Only track touch move for the item that initiated the touch
        if (swipingItemId.current !== id) return;

        touchCurrentX.current = e.touches[0].clientX;
        const diff = touchCurrentX.current - touchStartX.current;

        // console.log(`[CourseList] Touch Move on ${id}. Diff: ${diff}`); // Commented out

        // Logic for revealing the delete button
        // Set swipedCourseId if swiped far enough left and it's not already marked as swiped enough
        if (diff < -40 && !hasSwipedEnough.current) {
            // console.log(`[CourseList] Swiped enough to reveal for ${id}. Setting swipedCourseId to ${id}`); // Commented out
            setSwipedCourseId(id);
            hasSwipedEnough.current = true;
        }
        // Logic for immediately closing by swiping right *if already revealed*
        if (swipedCourseId === id && diff > 20) { // If it's the currently swiped item AND swiping right past threshold
            // console.log(`[CourseList] Swiped right enough to close for ${id}. Setting swipedCourseId to null`); // Commented out
            setSwipedCourseId(null);
            hasSwipedEnough.current = false; // Ensure it won't re-open due to lingering touch state
        }
    };

    const handleTouchEnd = (id) => {
        // console.log(`[CourseList] Touch End for ${id}. Final swipedCourseId: ${swipedCourseId}. hasSwipedEnough: ${hasSwipedEnough.current}`); // Commented out

        // If the item was successfully swiped open (hasSwipedEnough is true)
        // AND it's still the currently swiped item (`swipedCourseId === id`),
        // THEN we want it to *stay open*. Do NOT set swipedCourseId to null here.
        if (swipedCourseId === id && hasSwipedEnough.current) {
            // console.log(`[CourseList] Item ${id} remains swiped open.`); // Commented out
            // No state change needed for swipedCourseId, it stays open
        }
        // This 'else if' covers the case where the user lifts their finger from an item
        // that was already swiped open, but they didn't perform a "swipe enough to reveal" action
        // (e.g., they just tapped it, or performed a short drag that wasn't a "close" swipe).
        // In this scenario, we want to close the item.
        else if (swipedCourseId === id) {
            // console.log(`[CourseList] Item ${id} was open or not fully swiped. Closing.`); // Commented out
            setSwipedCourseId(null);
        }
        // If 'swipedCourseId' is null (no item is open) or it's a different item,
        // then nothing specific to close here as a result of this touch end.

        // Always reset the internal touch tracking refs after any touch ends
        swipingItemId.current = null;
        touchStartX.current = 0;
        touchCurrentX.current = 0;
        hasSwipedEnough.current = false;
    };

    return (
        <ul ref={listRef} className="list-none p-0 m-0"> {/* Attach the ref to the ul */}
            {courses.length === 0 ? (
                <div className="text-center p-8 text-gray-600">
                    <p>No courses added yet.</p>

                </div>
            ) : (
                courses.map((course) => (
                    <CourseItem
                        key={course.id}
                        course={course}
                        onClick={onSelectCourse}
                        onDelete={onDeleteCourse}
                        swipedCourseId={swipedCourseId}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        tournamentName={tournamentName}
                    />
                ))
            )}
        </ul>
    );
}