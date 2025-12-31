import { useState, useEffect } from 'react'
import './ThemeToggle.css'

export default function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme')
        return savedTheme || 'dark'
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <span className="theme-toggle-icon">
                {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span className="theme-toggle-label">
                {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
        </button>
    )
}
