'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 ${className}`}
      title={theme === 'dark' ? 'Modalità chiara' : 'Modalità scura'}
    >
      {theme === 'dark'
        ? <Sun  className="w-4 h-4" strokeWidth={1.5} />
        : <Moon className="w-4 h-4" strokeWidth={1.5} />
      }
    </button>
  )
}
