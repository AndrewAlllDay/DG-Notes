// tailwind.config.js
import plugin from 'tailwindcss/plugin'; // <-- Import the plugin helper

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                overlayShow: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                overlayHide: {
                    from: { opacity: '1' },
                    to: { opacity: '0' },
                },
                contentShow: {
                    from: {
                        opacity: '0',
                        transform: 'translate(-50%, -48%) scale(0.96)',
                    },
                    to: {
                        opacity: '1',
                        transform: 'translate(-50%, -50%) scale(1)',
                    },
                },
                contentHide: {
                    from: {
                        opacity: '1',
                        transform: 'translate(-50%, -50%) scale(1)',
                    },
                    to: {
                        opacity: '0',
                        transform: 'translate(-50%, -48%) scale(0.96)',
                    },
                },
            },
            animation: { // Keep these definitions
                overlayShow: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                overlayHide: 'overlayHide 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                contentShow: 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
                contentHide: 'contentHide 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
        },
    },
    plugins: [
        plugin(function ({ addVariant }) {
            // Define custom variants for Radix UI data-state attributes
            // These will allow classes like `data-open:animate-overlayShow`
            addVariant('data-open', '&[data-state="open"]');
            addVariant('data-closed', '&[data-state="closed"]');
        }),
    ],
};