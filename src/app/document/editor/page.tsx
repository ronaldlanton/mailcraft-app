'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Trash2,
  SplitSquareVertical,
  Image,
  MoveVertical,
  Download
} from 'lucide-react'

interface SubtopicType {
  id: string
  title: string
  content: string
  level: number
  children: SubtopicType[]
  images: string[]
}

type BodySize = 'small' | 'medium' | 'large'

// Add a strict mode wrapper component for react-beautiful-dnd
const StrictModeDroppable = ({ children, ...props }: React.ComponentProps<typeof Droppable>) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  // Fix isDropDisabled prop explicitly
  const fixedProps = { ...props };
  if ('isDropDisabled' in fixedProps) {
    fixedProps.isDropDisabled = !!fixedProps.isDropDisabled;
  }
  
  return <Droppable {...fixedProps}>{children}</Droppable>;
};

export default function DocumentEditor() {
  const router = useRouter()
  const [documentTitle, setDocumentTitle] = useState('')
  const [documentSubject, setDocumentSubject] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [subtopics, setSubtopics] = useState<SubtopicType[]>([])
  const [splitCount, setSplitCount] = useState<number>(3)
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null)
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [bodySize, setBodySize] = useState<BodySize>('medium')
  
  // Load saved document info on initial load
  useEffect(() => {
    const savedTitle = localStorage.getItem('documentTitle')
    const savedSubject = localStorage.getItem('documentSubject')
    
    if (!savedTitle || !savedSubject) {
      router.push('/document')
      return
    }
    
    setDocumentTitle(savedTitle)
    setDocumentSubject(savedSubject)
  }, [router])
  
  // Generate initial subtopics based on document subject
  const generateSubtopics = useCallback(async () => {
    if (!documentSubject) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate ${splitCount} comprehensive and balanced subtopics for a document about "${documentSubject}". 
Each subtopic should be relevant, distinct, and cover an important aspect of the main topic.
For each subtopic, provide a short, descriptive title (5-7 words maximum).
Return the result as a simple numbered list with just the titles, one per line.

Example format:
1. Introduction to Document Subject
2. Key Components and Elements
3. Practical Applications and Use Cases`,
          type: 'document'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate subtopics')
      }

      const result = await response.json()
      
      // Parse the content into subtopics
      const content = result.content
      const topicLines = content.split('\n').filter((line: string) => line.trim().length > 0)
      
      // Create subtopic objects
      const newSubtopics = topicLines.map((line: string, index: number) => {
        // Remove any numbers, periods, or other markers at the beginning of the line
        const title = line.replace(/^\d+[\.\)\s]+/, '').trim()
        
        return {
          id: `subtopic-${Date.now()}-${index}`,
          title: title,
          content: '',
          level: 1,
          children: [],
          images: []
        }
      })
      
      setSubtopics(newSubtopics)
    } catch (error) {
      console.error('Error generating subtopics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [documentSubject, splitCount])
  
  // Initialize document with subtopics if none exist
  useEffect(() => {
    if (documentSubject && subtopics.length === 0) {
      generateSubtopics()
    }
  }, [documentSubject, subtopics.length, generateSubtopics])
  
  // Select the first subtopic when subtopics change
  useEffect(() => {
    if (subtopics.length > 0 && !selectedSubtopic) {
      setSelectedSubtopic(subtopics[0].id)
    }
  }, [subtopics, selectedSubtopic])
  
  // Generate content for a subtopic
  const generateSubtopicContent = async (subtopicId: string, size: BodySize) => {
    const subtopic = findSubtopicById(subtopicId)
    if (!subtopic) return
    
    setIsLoading(true)
    try {
      // Determine word count based on size
      let wordCountRange = '150-200'
      if (size === 'small') wordCountRange = '100-150'
      if (size === 'large') wordCountRange = '250-350'
      
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Write a ${size} (${wordCountRange} words) detailed section about "${subtopic.title}" for a document on "${documentSubject}".
The content should be informative, well-structured, and written in a professional tone.
Provide substantive information with clear explanations.
Do not include a title or heading.`,
          type: 'document'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const result = await response.json()
      
      // Update the subtopic with generated content
      updateSubtopicContent(subtopicId, result.content)
    } catch (error) {
      console.error('Error generating content:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Split a subtopic into additional subtopics
  const splitSubtopic = async (subtopicId: string, count: number) => {
    const subtopic = findSubtopicById(subtopicId)
    if (!subtopic) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `I'm writing a document about "${documentSubject}" and have a section titled "${subtopic.title}".
Please suggest ${count} sub-sections for this topic that would make logical divisions.
Each sub-section should be distinct, comprehensive, and directly related to "${subtopic.title}".
Return the result as a simple numbered list with just the titles, one per line.

Example format:
1. First Sub-section Title
2. Second Sub-section Title
3. Third Sub-section Title`,
          type: 'document'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate subsections')
      }

      const result = await response.json()
      
      // Parse the content into subtopics
      const content = result.content
      const topicLines = content.split('\n').filter((line: string) => line.trim().length > 0)
      
      // Create child subtopic objects
      const newChildren = topicLines.map((line: string, index: number) => {
        // Remove any numbers, periods, or other markers at the beginning of the line
        const title = line.replace(/^\d+[\.\)\s]+/, '').trim()
        
        return {
          id: `subtopic-${Date.now()}-${index}-${subtopicId}`,
          title: title,
          content: '',
          level: subtopic.level + 1,
          children: [],
          images: []
        }
      })
      
      // Add these new subtopics to the children of the current subtopic
      addChildrenToSubtopic(subtopicId, newChildren)
    } catch (error) {
      console.error('Error splitting subtopic:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Find a subtopic by ID (recursive)
  const findSubtopicById = useCallback((id: string, topics: SubtopicType[] = subtopics): SubtopicType | null => {
    for (const topic of topics) {
      if (topic.id === id) {
        return topic
      }
      
      if (topic.children.length > 0) {
        const found = findSubtopicById(id, topic.children)
        if (found) return found
      }
    }
    
    return null
  }, [subtopics])
  
  // Update content of a subtopic
  const updateSubtopicContent = (id: string, content: string) => {
    setSubtopics(prevSubtopics => updateSubtopicInTree(prevSubtopics, id, { content }))
  }
  
  // Update title of a subtopic
  const updateSubtopicTitle = (id: string, title: string) => {
    setSubtopics(prevSubtopics => updateSubtopicInTree(prevSubtopics, id, { title }))
  }
  
  // Add image to a subtopic
  const addImageToSubtopic = (id: string, imageUrl: string) => {
    const subtopic = findSubtopicById(id)
    if (!subtopic) return
    
    setSubtopics(prevSubtopics => 
      updateSubtopicInTree(prevSubtopics, id, { 
        images: [...subtopic.images, imageUrl] 
      })
    )
  }
  
  // Remove image from a subtopic
  const removeImageFromSubtopic = (subtopicId: string, imageIndex: number) => {
    const subtopic = findSubtopicById(subtopicId)
    if (!subtopic) return
    
    const newImages = [...subtopic.images]
    newImages.splice(imageIndex, 1)
    
    setSubtopics(prevSubtopics => 
      updateSubtopicInTree(prevSubtopics, subtopicId, { 
        images: newImages 
      })
    )
  }
  
  // Helper function to update a subtopic in the tree
  const updateSubtopicInTree = (topics: SubtopicType[], id: string, updates: Partial<SubtopicType>): SubtopicType[] => {
    return topics.map(topic => {
      if (topic.id === id) {
        return { ...topic, ...updates }
      }
      
      if (topic.children.length > 0) {
        return {
          ...topic,
          children: updateSubtopicInTree(topic.children, id, updates)
        }
      }
      
      return topic
    })
  }
  
  // Add children to a subtopic
  const addChildrenToSubtopic = (id: string, children: SubtopicType[]) => {
    setSubtopics(prevSubtopics => 
      updateSubtopicInTree(prevSubtopics, id, { 
        children: [...(findSubtopicById(id)?.children || []), ...children] 
      })
    )
  }
  
  // Delete a subtopic
  const deleteSubtopic = (id: string) => {
    // Find the parent subtopic or determine if it's a top-level subtopic
    const findParentAndIndex = (topics: SubtopicType[], targetId: string): { parent: SubtopicType[] | null, index: number } => {
      for (let i = 0; i < topics.length; i++) {
        if (topics[i].id === targetId) {
          return { parent: topics, index: i }
        }
        
        if (topics[i].children.length > 0) {
          for (let j = 0; j < topics[i].children.length; j++) {
            if (topics[i].children[j].id === targetId) {
              return { parent: topics[i].children, index: j }
            }
            
            const result = findParentAndIndex(topics[i].children, targetId)
            if (result.parent !== null) return result
          }
        }
      }
      
      return { parent: null, index: -1 }
    }
    
    const { parent, index } = findParentAndIndex(subtopics, id)
    
    if (parent === null || index === -1) return
    
    // Clone the parent array
    const newParent = [...parent]
    // Remove the subtopic
    newParent.splice(index, 1)
    
    // If it's a top-level subtopic, update the subtopics state directly
    if (parent === subtopics) {
      setSubtopics(newParent)
      return
    }
    
    // Find the ID of the parent subtopic
    const findParentId = (topics: SubtopicType[], childId: string): string | null => {
      for (const topic of topics) {
        if (topic.children.some(child => child.id === childId)) {
          return topic.id
        }
        
        if (topic.children.length > 0) {
          const found = findParentId(topic.children, childId)
          if (found) return found
        }
      }
      
      return null
    }
    
    const parentId = findParentId(subtopics, id)
    
    if (parentId) {
      setSubtopics(prevSubtopics => 
        updateSubtopicInTree(prevSubtopics, parentId, { 
          children: newParent 
        })
      )
    }
  }
  
  // Handle reordering subtopics with drag and drop
  const handleDragEnd = (result: DropResult) => {
    // Handle drop outside the list
    if (!result.destination) {
      return
    }

    // Only handle drops within the main list
    if (result.source.droppableId === 'main-list' && result.destination.droppableId === 'main-list') {
      const sourceIndex = result.source.index
      const destinationIndex = result.destination.index
      
      // Create a new array without mutating the original
      const newSubtopics = [...subtopics]
      const [removed] = newSubtopics.splice(sourceIndex, 1)
      newSubtopics.splice(destinationIndex, 0, removed)
      
      setSubtopics(newSubtopics)
    }
  }
  
  // Generate the final document
  const generateDocument = () => {
    let documentText = `# ${documentTitle}\n\n`
    
    // Helper function to recursively add content
    const addSubtopicContent = (topics: SubtopicType[], level: number) => {
      topics.forEach(topic => {
        // Add heading with appropriate level
        documentText += `${'#'.repeat(level)} ${topic.title}\n\n`
        
        // Add content
        if (topic.content) {
          documentText += `${topic.content}\n\n`
        }
        
        // Add image references
        topic.images.forEach((img, idx) => {
          documentText += `![Image ${idx + 1} for ${topic.title}](${img})\n\n`
        })
        
        // Add children content
        if (topic.children.length > 0) {
          addSubtopicContent(topic.children, level + 1)
        }
      })
    }
    
    addSubtopicContent(subtopics, 2)
    
    setGeneratedDocument(documentText)
  }
  
  // Download document as Markdown
  const downloadMarkdown = () => {
    if (!generatedDocument) return
    
    const blob = new Blob([generatedDocument], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Function to handle image upload button click and file input
  const handleImageButtonClick = (subtopicId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        const reader = new FileReader()
        
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target && typeof event.target.result === 'string') {
            addImageToSubtopic(subtopicId, event.target.result)
          }
        }
        
        reader.readAsDataURL(file)
      }
    })
    input.click()
  }
  
  // Add ChildSubtopics component - remove the unused parentId parameter
  const ChildSubtopics = ({ subtopics }: { subtopics: SubtopicType[] }) => {
    return (
      <div className="space-y-4">
        {subtopics.map((topic) => (
          <div key={topic.id} className="mb-4">
            <div className="border rounded-lg p-4">
              <div className="flex-grow mx-2">
                <Input
                  value={topic.title}
                  onChange={(e) => updateSubtopicTitle(topic.id, e.target.value)}
                  className="font-semibold"
                />
              </div>
              
              <div className="mb-2">
                <Textarea
                  value={topic.content}
                  onChange={(e) => updateSubtopicContent(topic.id, e.target.value)}
                  placeholder="Enter or generate content for this section..."
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              {topic.children.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-gray-200">
                  <ChildSubtopics subtopics={topic.children} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link href="/document" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        
        <h1 className="text-2xl font-bold">{documentTitle}</h1>
        
        <div>
          <Button 
            variant="default" 
            onClick={generateDocument}
            disabled={isLoading}
            className="ml-2"
          >
            Generate Document
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <Input
                  type="number"
                  value={splitCount}
                  onChange={(e) => setSplitCount(parseInt(e.target.value))}
                  min={2}
                  max={10}
                  className="w-24"
                />
                <Button
                  variant="outline"
                  onClick={generateSubtopics}
                  disabled={isLoading}
                >
                  {subtopics.length > 0 ? 'Regenerate Sections' : 'Generate Sections'}
                </Button>
              </div>
              
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            {subtopics.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <StrictModeDroppable droppableId="main-list">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-4"
                    >
                      {subtopics.map((topic, index) => (
                        <Draggable key={topic.id} draggableId={topic.id} index={index}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`border rounded-lg p-4 mb-4 ${
                                selectedSubtopic === topic.id ? 'border-blue-500 shadow-md' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div {...dragProvided.dragHandleProps} className="cursor-grab p-1">
                                  <MoveVertical size={16} />
                                </div>
                                
                                <div className="flex-grow mx-2">
                                  <Input
                                    value={topic.title}
                                    onChange={(e) => updateSubtopicTitle(topic.id, e.target.value)}
                                    className="font-semibold"
                                  />
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => splitSubtopic(topic.id, 3)}
                                    title="Split into subtopics"
                                  >
                                    <SplitSquareVertical size={16} />
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleImageButtonClick(topic.id)}
                                    title="Add image"
                                  >
                                    <Image size={16} />
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => deleteSubtopic(topic.id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="mb-2">
                                <Textarea
                                  value={topic.content}
                                  onChange={(e) => updateSubtopicContent(topic.id, e.target.value)}
                                  placeholder="Enter or generate content for this section..."
                                  rows={4}
                                  className="resize-none"
                                />
                                
                                <div className="flex justify-between mt-2">
                                  <Select
                                    value={bodySize}
                                    onValueChange={(value: string) => setBodySize(value as BodySize)}
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue placeholder="Size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="small">Small</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateSubtopicContent(topic.id, bodySize)}
                                  >
                                    Generate Content
                                  </Button>
                                </div>
                              </div>
                              
                              {topic.images.length > 0 && (
                                <div className="mb-2">
                                  <Label className="mb-1 block">Images</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {topic.images.map((img, idx) => (
                                      <div key={idx} className="relative group">
                                        <img
                                          src={img}
                                          alt={`Image for ${topic.title}`}
                                          className="h-20 w-20 object-cover rounded"
                                        />
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => removeImageFromSubtopic(topic.id, idx)}
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Render children */}
                              {topic.children.length > 0 && (
                                <div className="mt-4 pl-6 border-l-2 border-gray-200">
                                  <ChildSubtopics subtopics={topic.children} />
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </div>
      
      {generatedDocument && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex justify-between">
              <span>Generated Document</span>
              <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                <Download size={16} className="mr-2" />
                Download Markdown
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-[500px]">
              <pre className="whitespace-pre-wrap">{generatedDocument}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 