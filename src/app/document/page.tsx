'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DocumentFormData {
  title: string
  subject: string
}

export default function DocumentCraft() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<DocumentFormData>({
    defaultValues: {
      title: '',
      subject: ''
    }
  })
  
  const onSubmit = async (data: DocumentFormData) => {
    setIsLoading(true)
    try {
      // Save document details to local storage for next step
      localStorage.setItem('documentTitle', data.title)
      localStorage.setItem('documentSubject', data.subject)
      
      // Navigate to document editor
      router.push('/document/editor')
    } catch (error) {
      console.error('Error starting document creation:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Document</CardTitle>
          <CardDescription>
            Start by entering the title and subject of your document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="Enter document title"
                {...register('title', { required: 'Document title is required' })}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Document Subject/Topic</Label>
              <Input
                id="subject"
                placeholder="What is this document about?"
                {...register('subject', { required: 'Document subject is required' })}
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-red-500 text-sm">{errors.subject.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Continue to Document Editor'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 