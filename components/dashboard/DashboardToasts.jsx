"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'

export default function DashboardToasts() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser() // Still grabbing this just to say their name in the toast!

  useEffect(() => {
    const authStatus = searchParams.get('auth')

    if (authStatus) {
      if (authStatus === 'success') {
        toast.success(`Welcome back, ${user?.firstName || 'User'}!`, {
          icon: '👋',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        })
      } else if (authStatus === 'new') {
        toast.success('Account created successfully!', {
          icon: '🎉',
        })
      } else if (authStatus === 'error') {
        toast.error('Welcome, but database sync failed.')
      }

      // Clean the URL so the toast doesn't fire again on page refresh
      router.replace('/dashboard', { scroll: false }) 
    }
  }, [searchParams, router, user])

  // This component handles logic only, it renders no visible HTML
  return null 
}