import React, { useState, useEffect } from 'react';

export default function AddCourseModal({
    isOpen,
    onClose,
    onSubmit,
    newCourseName,
    setNewCourseName,
    newCourseTournamentName,
    setNewCourseTournamentName,
    newCourseClassification,
    setNewCourseClassification,
    modalOrigin
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsAnimated(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimated(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;
        onSubmit(newCourseName, newCourseTournamentName, newCourseClassification);
        onClose();
    };

    const modalStyle = isAnimated
        ? {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            opacity: 1,
        }
        : {
            top: modalOrigin?.top,
            left: modalOrigin?.left,
            width: modalOrigin?.width,
            height: modalOrigin?.height,
            borderRadius: '50%',
            opacity: 1,
        };

    const contentClasses = `bg-white dark:bg-gray-800 rounded-lg p-6 w-96 transition-opacity duration-300 transform ${isAnimated ? 'opacity-100 delay-300' : 'opacity-0'}`;

    return (
        <div
            className={`fixed flex items-center justify-center z-50 bg-blue-600 transition-all duration-200 ease-in-out`}
            style={modalStyle}
        >
            <div className={contentClasses}>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New Course</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Course Name"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-gray-700"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Tournament Name (Optional)"
                        value={newCourseTournamentName}
                        onChange={(e) => setNewCourseTournamentName(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-gray-700"
                    />
                    <select
                        value={newCourseClassification}
                        onChange={(e) => setNewCourseClassification(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-gray-700"
                        required
                    >
                        <option value="">Select Course Style</option>
                        <option value="wooded">Wooded</option>
                        <option value="park_style">Park Style</option>
                        <option value="open_bomber">Open Bomber</option>
                    </select>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="!bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Add Course
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}