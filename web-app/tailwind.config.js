import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    plugins: [heroui()],
    /**
     * Tailwind searches the codebase and only bundles the styles that are used.
     * However, dynamically created styles are not considered so they are missing in
     * the final source.
     * This affect classes that are dynamically generated, e.g. with `text-${option.textColor}`.
     * To solve this problem, these styles can be added to the `saflist` below. These
     * styles are always part of the final source code.
     * Another option would be to bundle all styles which would not be very efficient.
     */
    safelist: [],
};
