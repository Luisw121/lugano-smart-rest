'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  cookieName: string
  locale: string
  label?: string
}

export default function LogoutButton({ cookieName, locale, label = 'Esci' }: Props) {
  const router = useRouter()

  function handleLogout() {
    document.cookie = `${cookieName}=; path=/; max-age=0`
    router.push(`/${locale}`)
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-red-500
                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <LogOut className="w-4 h-4" strokeWidth={1.5} />
      {label}
    </button>
  )
}
