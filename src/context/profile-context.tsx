"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface ProfileContextType {
  name: string
  email: string
  profileImage: string
  updateName: (name: string) => void
  updateEmail: (email: string) => void
  updateProfileImage: (imageUrl: string) => void
}

const defaultProfileContext: ProfileContextType = {
  name: 'User',
  email: 'user@example.com',
  profileImage: '/profile-placeholder.svg',
  updateName: () => {},
  updateEmail: () => {},
  updateProfileImage: () => {}
}

const ProfileContext = createContext<ProfileContextType>(defaultProfileContext)

export const useProfile = () => useContext(ProfileContext)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState({
    name: 'User',
    email: 'user@example.com',
    profileImage: '/profile-placeholder.svg'
  })

  // Load profile from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile')
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile)
        setProfile(parsedProfile)
      } catch (error) {
        console.error('Failed to parse profile from localStorage:', error)
      }
    }
  }, [])

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile))
  }, [profile])

  const updateName = (name: string) => {
    setProfile(prev => ({ ...prev, name }))
  }

  const updateEmail = (email: string) => {
    setProfile(prev => ({ ...prev, email }))
  }

  const updateProfileImage = (imageUrl: string) => {
    setProfile(prev => ({ ...prev, profileImage: imageUrl }))
  }

  return (
    <ProfileContext.Provider 
      value={{
        ...profile,
        updateName,
        updateEmail,
        updateProfileImage
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
} 