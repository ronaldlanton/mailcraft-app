'use client'

import { createContext, useContext, useEffect } from 'react'
import { useSession, signIn, signOut, SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'

type AuthContextType = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (provider?: string, options?: Record<string, unknown>) => Promise<unknown>;
  signOut: () => Promise<unknown>;
}

// Create a context for authentication
const AuthContext = createContext<AuthContextType>({
  session: null,
  status: "unauthenticated",
  signIn: async () => null,
  signOut: async () => null
})

// Create a provider component to wrap the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderContent>{children}</AuthProviderContent>
    </SessionProvider>
  )
}

// Inner provider that uses the session
function AuthProviderContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Sync the session with local storage for profile integration
  useEffect(() => {
    if (session?.user) {
      // Existing profile data in localStorage
      const existingProfile = localStorage.getItem('userProfile')
      const profile = existingProfile ? JSON.parse(existingProfile) : {}
      
      // Update profile with session data if available
      if (session.user.name && !profile.name) {
        profile.name = session.user.name
      }
      
      if (session.user.email && !profile.email) {
        profile.email = session.user.email
      }
      
      if (session.user.image && !profile.image) {
        profile.image = session.user.image
      }
      
      // Save back to localStorage
      localStorage.setItem('userProfile', JSON.stringify(profile))
    }
  }, [session])

  return (
    <AuthContext.Provider value={{ session, status, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext) 