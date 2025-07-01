// src/components/CourseItem.jsx

import React from 'react';
import { Trash, ChevronRight } from 'lucide-react';

export default function CourseItem({
    course,
    onClick,
    onDelete,
    swipedCourseId,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    tournamentName,
}) {
    const isSwiped = swipedCourseId === course.id;

    // Define the width of the delete button and how far the content slides.
    // The delete button's width should be GREATER THAN the distance the main content slides.
    const deleteButtonWidthClass = 'w-28'; // Button is 112px wide
    const swipeDistance = '-80px';      // Main content slides 80px to the left

    return (
        <li className="relative h-20 select-none touch-pan-y mb-2 overflow-hidden">

            {/* DELETE BUTTON - Ensures the icon is centered */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course.id);
                }}
                className={`absolute right-0 top-0 bottom-0 ${deleteButtonWidthClass} !bg-red-600 text-white flex items-center justify-center z-10 rounded-r-lg`}
                aria-label={`Delete ${course.name}`}
            >
                <Trash className='ml-5' size={24} />
            </button>

            {/* MAIN COURSE CONTENT DIV */}
            <div
                id={`course-${course.id}`}
                className={`
                    absolute inset-0
                    bg-white dark:bg-gray-800
                    border border-gray-200 dark:border-gray-700
                    rounded-lg
                    shadow-sm
                    z-20
                    flex items-center justify-between
                    px-4
                    cursor-pointer
                    transition-all duration-300 ease-in-out
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    hover:shadow-md
                    active:bg-gray-100 dark:active:bg-gray-600
                    transform
                `}
                style={{
                    transform: isSwiped ? `translateX(${swipeDistance})` : 'translateX(0)',
                }}
                onClick={() => onClick(course)}
                onTouchStart={(e) => onTouchStart(e, course.id)}
                onTouchMove={(e) => onTouchMove(e, course.id)}
                onTouchEnd={() => onTouchEnd(course.id)}
            >
                <div>
                    <p className="text-lg text-gray-800 dark:text-white">
                        <span className='font-bold'>{course.name}</span>
                    </p>
                    {tournamentName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                            {tournamentName}
                        </p>
                    )}
                </div>
                <div className="ml-auto text-gray-400 dark:text-gray-500">
                    <ChevronRight size={20} />
                </div>
            </div>
        </li>
    );
}