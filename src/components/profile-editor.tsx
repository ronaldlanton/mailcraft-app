"use client"

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useProfile } from '@/context/profile-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ProfileEditor({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { name, email, profileImage, updateName, updateEmail, updateProfileImage } = useProfile()
  
  const [nameInput, setNameInput] = useState(name)
  const [emailInput, setEmailInput] = useState(email)
  const [imagePreview, setImagePreview] = useState(profileImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSave = () => {
    updateName(nameInput)
    updateEmail(emailInput)
    updateProfileImage(imagePreview)
    onOpenChange(false)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information used in email generation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
              <Image 
                src={imagePreview} 
                alt="Profile" 
                fill
                className="object-cover"
              />
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <Button type="button" variant="outline" onClick={triggerFileInput}>
              Change Image
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Your email address"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 