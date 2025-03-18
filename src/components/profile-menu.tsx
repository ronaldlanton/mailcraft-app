"use client"

import * as React from "react"
import { User, Settings, LogOut, LogIn } from "lucide-react"
import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Session } from 'next-auth'
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle"
import { useProfile } from "@/context/profile-context"
import { ProfileEditor } from "./profile-editor"
import { useAuth } from "@/context/auth-context"
import { Button } from "./ui/button"

export function ProfileMenu() {
  const { name, email, profileImage } = useProfile()
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false)
  const { session, status, signOut } = useAuth()
  const router = useRouter()
  const [imageError, setImageError] = React.useState(false)

  const handleLogout = async () => {
    await signOut()
  }

  const handleLogin = () => {
    router.push('/login')
  }

  // If not authenticated, show login button
  if (status === 'unauthenticated') {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleLogin}
        className="flex items-center gap-2"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </Button>
    )
  }

  // While loading auth state, show a smaller placeholder
  if (status === 'loading') {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
    )
  }

  // When authenticated, show the full profile menu
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow">
            {!imageError && session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="h-full w-full object-cover bg-gray-100 dark:bg-gray-800"
                onError={() => setImageError(true)}
              />
            ) : (
              <img 
                src={profileImage || '/profile-placeholder.png'} 
                alt="Profile placeholder" 
                className="h-full w-full object-cover bg-gray-100 dark:bg-gray-800"
              />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{session?.user?.name || name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user?.email || email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileEditor 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </>
  )
} 