import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * A reusable, memoized accordion component.
 * Manages its own open/closed state.
 */
const Accordion = React.memo(({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    // useCallback ensures this function isn't recreated on every render of the Accordion
    const toggleAccordion = useCallback(() => setIsOpen(prev => !prev), []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
                className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 dark:text-gray-100 focus:outline-none !bg-white dark:!bg-gray-800 rounded-lg"
                onClick={toggleAccordion}
                aria-expanded={isOpen}
            >
                {title}
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
});

export default Accordion;