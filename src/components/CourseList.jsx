import React, { useEffect, useRef } from 'react';
import { Trash } from 'lucide-react';
import CourseItem from './CourseItem'; // Assuming it's in the same 'components' folder

export default function CourseList({
    courses,
    setSelectedCourse,
    deleteCourse,
    swipedCourseId,
    setSwipedCourseId,
}) {
    const swipeRefs = useRef({});

    const handleTouchStart = (e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX };
        if (swipedCourseId && swipedCourseId !== id) {
            const prevEl = document.getElementById(`course-${swipedCourseId}`);
            if (prevEl) {
                prevEl.style.transition = 'transform 0.3s ease';
                prevEl.style.transform = 'translateX(0)';
            }
            setSwipedCourseId(null);
        }
    };

    const handleTouchMove = (e, id) => {
        if (!swipeRefs.current[id]) return;
        const deltaX = e.touches[0].clientX - swipeRefs.current[id].startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) return;

        if (deltaX < -30) {
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(-80px)';
            setSwipedCourseId(id);
        } else if (deltaX > 30) {
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(0)';
            setSwipedCourseId(null);
        }
    };

    const handleTouchEnd = (id) => {
        const el = document.getElementById(`course-${id}`);
        if (!el) return;
        el.style.transition = 'transform 0.3s ease';
        el.style.transform = swipedCourseId === id ? 'translateX(-80px)' : 'translateX(0)';
        swipeRefs.current[id] = null;
    };

    useEffect(() => {
        const cleanupFns = [];
        courses.forEach((course) => {
            const el = document.getElementById(`course-${course.id}`);
            if (!el) return;
            const onTransitionEnd = () => {
                el.style.transition = '';
            };
            el.addEventListener('transitionend', onTransitionEnd);
            cleanupFns.push(() => el.removeEventListener('transitionend', onTransitionEnd));
        });
        return () => cleanupFns.forEach((fn) => fn());
    }, [courses]);

    return (
        <ul className="space-y-4 mt-6">
            {courses.length === 0 ? (
                <li>No courses added yet.</li>
            ) : (
                courses.map((course) => (
                    <CourseItem
                        key={course.id}
                        course={course}
                        onClick={() => {
                            if (swipedCourseId === course.id) {
                                setSwipedCourseId(null);
                                return;
                            }
                            setSelectedCourse(course);
                        }}
                        onDelete={(e) => deleteCourse(e, course.id)}
                        swipedCourseId={swipedCourseId}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />
                ))
            )}
        </ul>
    );
}