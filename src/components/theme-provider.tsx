'use client';

import { useEffect } from 'react';

const formatHsl = (hsl: [number, number, number]): string => {
  return `${hsl[0]} ${hsl[1]}% ${hsl[2]}%`;
};

export function ThemeProvider() {
    useEffect(() => {
        const savedUserTheme = localStorage.getItem('user-theme');
        if (savedUserTheme) {
            try {
                const parsedTheme = JSON.parse(savedUserTheme);
                const root = document.documentElement;
                Object.entries(parsedTheme).forEach(([name, hsl]) => {
                    root.style.setProperty(`--${name}`, formatHsl(hsl as [number, number, number]));
                });
            } catch (e) {
                console.error("Failed to parse user theme from localStorage", e);
                localStorage.removeItem('user-theme');
            }
        }
    }, []);

    return null; // This component does not render anything
}
