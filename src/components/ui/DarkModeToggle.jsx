import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * DarkModeToggle — Toggles between light and dark mode.
 *
 * Reads initial preference from localStorage or system preference.
 * Adds/removes the `.dark` class on the document root.
 * Persists choice in localStorage under 'theme'.
 */
export default function DarkModeToggle({ className = '' }) {
    const [dark, setDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [dark]);

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setDark(v => !v)}
            className={`h-8 w-8 p-0 ${className}`}
            aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </Button>
    );
}
