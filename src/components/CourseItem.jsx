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
    return (
        <li className="relative h-16 overflow-hidden select-none touch-pan-y">
            <button
                onClick={onDelete}
                className="fab-fix absolute right-0 top-0 bottom-0 w-20 bg-red-600 text-white flex items-center justify-center z-0"
                aria-label={`Delete ${course.name}`}
            >
                <Trash />
            </button>
            <div
                id={`course-${course.id}`}
                className="absolute inset-0 bg-white border z-10 flex items-center px-4 cursor-pointer hover:bg-gray-50"
                style={{
                    transform: swipedCourseId === course.id ? 'translateX(-80px)' : 'translateX(0)',
                    transition: 'transform 0.3s ease',
                }}
                onClick={onClick}
                onTouchStart={(e) => onTouchStart(e, course.id)}
                onTouchMove={(e) => onTouchMove(e, course.id)}
                onTouchEnd={() => onTouchEnd(course.id)}
            >
                {course.name}
            </div>
        </li>
    );
}