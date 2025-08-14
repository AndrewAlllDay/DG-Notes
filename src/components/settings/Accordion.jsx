import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/**
 * A reusable, memoized accordion component.
 * Manages its own open/closed state with a smooth CSS transition.
 */
const Accordion = React.memo(({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState(defaultOpen ? 'auto' : '0px');

    const toggleAccordion = useCallback(() => setIsOpen(prev => !prev), []);

    useEffect(() => {
        if (isOpen) {
            // For a smooth open, set maxHeight to the content's full scroll height.
            // Using 'auto' is necessary to allow for variable content height.
            // The `setTimeout` ensures the CSS transition is applied after the height is calculated.
            const contentHeight = contentRef.current.scrollHeight;
            setMaxHeight(`${contentHeight}px`);
        } else {
            // For a smooth close, first set the height to the current scroll height,
            // then immediately transition it to 0. This prevents a "jump" on closing.
            setMaxHeight(`${contentRef.current.scrollHeight}px`);
            setTimeout(() => {
                setMaxHeight('0px');
            }, 0);
        }
    }, [isOpen]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
                className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 dark:text-gray-100 focus:outline-none !bg-white dark:!bg-gray-800 rounded-lg"
                onClick={toggleAccordion}
                aria-expanded={isOpen}
            >
                {title}
                <div className="transition-transform duration-300 ease-in-out">
                    {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
            </button>
            <div
                ref={contentRef}
                className="transition-max-height duration-500 ease-in-out overflow-hidden"
                style={{ maxHeight: maxHeight }}
            >
                <div className="px-6 pb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
});

export default Accordion;