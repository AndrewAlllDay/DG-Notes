// src/components/CourseList.jsx

import React from 'react';
import CourseItem from './CourseItem';

export default function CourseList({
    courses,
    setSelectedCourse,
    deleteCourse,
    swipedCourseId,
    // These functions are received as props from Courses.jsx
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
}) {
    return (
        <ul className="space-y-4">
            {courses.map((course) => (
                <CourseItem
                    key={course.id}
                    course={course}
                    onClick={setSelectedCourse}
                    onDelete={deleteCourse}
                    swipedCourseId={swipedCourseId}
                    // Pass the touch handlers down to CourseItem
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    // NEW: Pass the tournamentName to CourseItem
                    tournamentName={course.tournamentName}
                />
            ))}
        </ul>
    );
}