"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/context/auth-context"
import { useProfile } from "@/context/profile-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" })
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function FirstLoginProfile() {
  const { session, status } = useAuth()
  const { setName, setEmail } = useProfile()
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasShown, setHasShown] = React.useState(false)

  // Initialize form with user data from session
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      email: session?.user?.email || ""
    }
  })

  // Check if we should show the dialog
  React.useEffect(() => {
    // Only show if authenticated, not already shown, and session is loaded
    if (status === 'authenticated' && !hasShown && session?.user) {
      const hasCompletedProfile = localStorage.getItem('hasCompletedProfile') === 'true'
      if (!hasCompletedProfile) {
        setIsOpen(true)
        setHasShown(true)
      }
    }
  }, [status, session, hasShown])

  // Update form values when session changes
  React.useEffect(() => {
    if (session?.user) {
      form.setValue('name', session.user.name || '')
      form.setValue('email', session.user.email || '')
    }
  }, [session, form])

  function onSubmit(data: ProfileFormValues) {
    setName(data.name)
    setEmail(data.email)
    localStorage.setItem('hasCompletedProfile', 'true')
    localStorage.setItem('userName', data.name)
    localStorage.setItem('userEmail', data.email)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to MailCraft!</DialogTitle>
          <DialogDescription>
            Please confirm your information for email generation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save Information
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 