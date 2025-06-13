// src/components/CourseItem.jsx

import React from 'react';
import { Trash } from 'lucide-react';

export default function CourseItem({
    course,
    onClick,
    onDelete,
    swipedCourseId,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}) {
    console.log(`Rendering Course: ${course.name}, Tournament Value: '${course.tournament}'`);

    return (
        <li className="relative h-16 overflow-hidden select-none touch-pan-y">
            {/* DELETE BUTTON - ADD CONSOLE.LOG HERE */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevents the click from bubbling up to the div
                    console.log(`Delete button clicked for course ID: ${course.id}`); // <--- ADD THIS LINE
                    onDelete(course.id); // Pass the specific course.id to the onDelete handler
                }}
                className="fab-fix absolute right-0 top-0 bottom-0 w-20 bg-red-600 text-white flex items-center justify-center z-10 del-btn-fix rounded-tr-lg rounded-br-lg"
                aria-label={`Delete ${course.name}`}
            >
                <Trash />
            </button>

            {/* MAIN COURSE CONTENT DIV */}
            <div
                id={`course-${course.id}`}
                className="absolute inset-0 bg-white border z-20 flex items-center px-4 cursor-pointer hover:bg-gray-50"
                style={{
                    transform: swipedCourseId === course.id ? 'translateX(-80px)' : 'translateX(0)',
                    transition: 'transform 0.3s ease',
                }}
                onClick={() => onClick(course)}
                onTouchStart={(e) => onTouchStart(e, course.id)}
                onTouchMove={(e) => onTouchMove(e, course.id)}
                onTouchEnd={() => onTouchEnd(course.id)}
            >
                <div>
                    <h3 className="font-semibold">{course.name}</h3>
                    {course.tournament && (
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.1rem' }}>
                            Tournament: {course.tournament}
                        </p>
                    )}
                </div>
            </div>
        </li>
    );
}