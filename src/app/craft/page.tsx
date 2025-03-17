'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface QuestionItem {
  id: string
  question: string
  answer: string
  type: string
  options: string[]
}

interface FormData {
  emailIdea: string
  questionItems: QuestionItem[]
}

type ViewMode = 'sequential' | 'all'

export default function CraftEmail() {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedEmail, setGeneratedEmail] = useState<string | 'loading' | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<ViewMode>('sequential')
  const [emailTone, setEmailTone] = useState<string>('Professional')
  const [placeholders, setPlaceholders] = useState<{text: string, replacement: string}[]>([])
  const [updatedEmail, setUpdatedEmail] = useState('')
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null)
  const [deletedCardIndex, setDeletedCardIndex] = useState<number | null>(null)
  
  const { register, handleSubmit, watch, control, setValue } = useForm<FormData>({
    defaultValues: {
      emailIdea: '',
      questionItems: []
    }
  })
  
  const { fields, replace } = useFieldArray({
    control,
    name: 'questionItems'
  })

  // Extract placeholders from generated email
  useEffect(() => {
    if (generatedEmail && generatedEmail !== 'loading') {
      // Find all text within square brackets
      const regex = /\[(.*?)\]/g;
      const matches = [...generatedEmail.matchAll(regex)];
      
      if (matches.length > 0) {
        const newPlaceholders = matches.map(match => ({
          text: match[0], // The full match including brackets
          replacement: '' // Empty replacement initially
        }));
        setPlaceholders(newPlaceholders);
        setUpdatedEmail(generatedEmail);
      } else {
        setPlaceholders([]);
        setUpdatedEmail(generatedEmail);
      }
    }
  }, [generatedEmail]);
  
  // Function to replace placeholders in the email
  const replacePlaceholder = (index: number, value: string) => {
    const newPlaceholders = [...placeholders];
    newPlaceholders[index].replacement = value;
    setPlaceholders(newPlaceholders);
  };
  
  // Function to update the email with all replacements
  const updateEmailWithReplacements = () => {
    let newEmail = updatedEmail;
    
    placeholders.forEach(placeholder => {
      if (placeholder.replacement) {
        newEmail = newEmail.replace(placeholder.text, placeholder.replacement);
      }
    });
    
    setUpdatedEmail(newEmail);
  };

  const analyzeIdea = async (data: FormData) => {
    setIsLoading(true)
    setCurrentQuestionIndex(0)
    setAnswers({})
    
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Based on the following email idea, create a set of questions that will help craft a great email. 
For each question, you can specify a question type and additional metadata using the following format:

[QUESTION]: The actual question text
[TYPE]: (optional) One of: TEXT (default), CHOICES, DATE, TIME, NUMBER
[OPTIONS]: (only for CHOICES type) Comma-separated list of options
[DEFAULT]: (optional) Default value or suggested answer
[END]

Example:
[QUESTION]: What's the tone you want for this email?
[TYPE]: CHOICES
[OPTIONS]: Formal, Casual, Friendly but professional, Direct and concise
[END]

[QUESTION]: When do you need a response by?
[TYPE]: DATE
[END]

For plain text questions, you can use a simpler format:
[QUESTION]: Who is the intended recipient of this email?
[END]

Now, based on this email idea, provide 4-6 helpful questions that will guide the user:
${data.emailIdea}`,
          type: 'craft'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze idea')
      }

      const result = await response.json()
      
      // Parse the structured content into questions with metadata
      const content = result.content
      const questionBlocks = content.split('[QUESTION]:')
        .slice(1) // Skip the empty first element
        .map((block: string) => {
          const questionEndIndex = block.indexOf('[TYPE]:') !== -1 
            ? block.indexOf('[TYPE]:') 
            : block.indexOf('[END]');
          
          const question = block.substring(0, questionEndIndex).trim();
          
          // Extract type
          let type = 'TEXT'; // Default type
          if (block.includes('[TYPE]:')) {
            const typeStartIndex = block.indexOf('[TYPE]:') + '[TYPE]:'.length;
            const typeEndIndex = block.indexOf('\n', typeStartIndex) !== -1 
              ? block.indexOf('\n', typeStartIndex) 
              : block.indexOf('[', typeStartIndex) !== -1 
                ? block.indexOf('[', typeStartIndex)
                : block.indexOf('[END]');
            
            type = block.substring(typeStartIndex, typeEndIndex).trim().toUpperCase();
          }
          
          // Extract options for CHOICES type
          let options: string[] = [];
          if (type === 'CHOICES' && block.includes('[OPTIONS]:')) {
            const optionsStartIndex = block.indexOf('[OPTIONS]:') + '[OPTIONS]:'.length;
            const optionsEndIndex = block.indexOf('\n', optionsStartIndex) !== -1 
              ? block.indexOf('\n', optionsStartIndex) 
              : block.indexOf('[', optionsStartIndex) !== -1 
                ? block.indexOf('[', optionsStartIndex)
                : block.indexOf('[END]');
            
            options = block
              .substring(optionsStartIndex, optionsEndIndex)
              .split(',')
              .map(opt => opt.trim())
              .filter(Boolean);
          }
          
          // Extract default value if provided
          let defaultValue = '';
          if (block.includes('[DEFAULT]:')) {
            const defaultStartIndex = block.indexOf('[DEFAULT]:') + '[DEFAULT]:'.length;
            const defaultEndIndex = block.indexOf('\n', defaultStartIndex) !== -1 
              ? block.indexOf('\n', defaultStartIndex) 
              : block.indexOf('[', defaultStartIndex) !== -1 
                ? block.indexOf('[', defaultStartIndex)
                : block.indexOf('[END]');
            
            defaultValue = block.substring(defaultStartIndex, defaultEndIndex).trim();
          }
          
          return {
            question,
            type,
            options,
            default: defaultValue
          };
        });
      
      // Convert to question items
      const questionItems = questionBlocks.map((item: {question: string, type: string, options?: string[], default?: string}, index: number) => ({
        id: `q-${index}`,
        question: item.question,
        answer: item.default || '',
        type: item.type,
        options: item.options
      }));
      
      // Replace the field array with new items
      replace(questionItems);
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to analyze your email idea. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = (index: number, answer: string) => {
    // Save the current answer
    setAnswers(prev => ({
      ...prev,
      [fields[index].id]: answer
    }))

    // Register the answer in the form
    setValue(`questionItems.${index}.answer`, answer)

    // Move to the next question or generate email if at the end
    if (index < fields.length - 1) {
      setCurrentQuestionIndex(index + 1)
    } else {
      handleSubmit(generateEmail)()
    }
  }

  const generateEmail = async (data: FormData) => {
    setIsLoading(true)
    setGeneratedEmail('loading') // Set a loading state to show the panel
    
    try {
      // Format the questions and answers for the prompt
      const questionAnswers = data.questionItems
        .map(item => `${item.question}: ${item.answer}`)
        .join('\n')
      
      // Get profile information
      const profile = {
        name: localStorage.getItem('userProfile') ? JSON.parse(localStorage.getItem('userProfile')!).name : 'User',
        email: localStorage.getItem('userProfile') ? JSON.parse(localStorage.getItem('userProfile')!).email : 'user@example.com'
      }
      
      // Create a prompt for email generation with the selected tone
      const prompt = `Generate a well-structured email based on the following information:
      
KEY POINTS:
${questionAnswers}

TONE: ${emailTone}

SENDER INFO:
Name: ${profile.name}
Email: ${profile.email}

Create a ${emailTone.toLowerCase()} email with appropriate greeting, body, and sign-off.`

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type: 'generate'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate email')
      }

      const result = await response.json()
      setGeneratedEmail(result.content)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate email. Please try again.')
      setGeneratedEmail('') // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (fieldId: string, value: string) => {
    const newAnswers = {...answers};
    newAnswers[fieldId] = value;
    setAnswers(newAnswers);
    
    // Find the index of the field with this id
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex !== -1) {
      setValue(`questionItems.${fieldIndex}.answer`, value);
    }
  }
  
  const handleDeleteQuestion = (fieldId: string) => {
    // Find the index of the field with this id before animating
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    
    if (fieldIndex !== -1) {
      // Set the animating card ID and index to trigger animations
      setAnimatingCardId(fieldId);
      setDeletedCardIndex(fieldIndex);
      
      // Wait for animation to complete before removing from state
      setTimeout(() => {
        // Remove from form state
        const newFields = [...fields];
        newFields.splice(fieldIndex, 1);
        replace(newFields);
        
        // Remove from answers
        const newAnswers = {...answers};
        delete newAnswers[fieldId];
        setAnswers(newAnswers);
        
        // Adjust current index if needed
        if (viewMode === 'sequential' && currentQuestionIndex >= newFields.length) {
          setCurrentQuestionIndex(Math.max(0, newFields.length - 1));
        }
        
        // Reset animation states
        setAnimatingCardId(null);
        setDeletedCardIndex(null);
      }, 300); // Match animation duration
    }
  }
  
  const handleSubmitAllAnswers = () => {
    // Check if all questions have been answered
    const allAnswered = fields.every(field => answers[field.id] && answers[field.id].trim() !== '');
    
    if (allAnswered) {
      handleSubmit(generateEmail)();
    } else {
      alert('Please answer all questions before generating the email.');
    }
  }

  // Add a tone selector component
  const ToneSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <span>Tone: {emailTone}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Email Tone</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {['Professional', 'Casual', 'Friendly', 'Formal', 'Direct', 'Enthusiastic', 'Respectful'].map(tone => (
          <DropdownMenuItem 
            key={tone} 
            onClick={() => setEmailTone(tone)}
            className={emailTone === tone ? 'bg-accent' : ''}
          >
            {tone}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Helper function to determine card animation classes
  const getCardAnimationClasses = (fieldId: string, index: number) => {
    if (animatingCardId === fieldId) {
      return "animate-slide-out-right animate-fade-out";
    }
    
    // Apply slide-up animation to cards below the deleted card
    if (deletedCardIndex !== null && index > deletedCardIndex) {
      return "animate-slide-up";
    }
    
    return "";
  }

  return (
    <div className="container mx-auto py-8 flex flex-col min-h-[calc(100vh-14rem)] justify-center">
      {fields.length === 0 && !generatedEmail && (
        <div className="max-w-2xl w-full mx-auto">
          <div className="relative mb-4">
            <Link href="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 absolute left-0 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-center">Craft a New Email</h1>
          </div>
          <Card className="w-full">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit(analyzeIdea)}>
                <Textarea
                  placeholder="Describe what you want to write about and we'll help you craft the perfect email"
                  className="min-h-32 w-full resize-none"
                  {...register('emailIdea')}
                />
                <div className="flex justify-center mt-4">
                  <Button 
                    type="submit" 
                    className="w-1/3"
                    disabled={isLoading || !watch('emailIdea')}
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {fields.length > 0 && !generatedEmail && (
        <div className="max-w-4xl mx-auto space-y-4 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              {viewMode === 'sequential' && (
                <>
                  <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1} of {fields.length}</h2>
                  <p className="text-sm text-gray-500">Answer each question to create your email</p>
                </>
              )}
              {viewMode === 'all' && (
                <>
                  <h2 className="text-xl font-semibold">{watch('emailIdea')}</h2>
                </>
              )}
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <Button 
                variant={viewMode === 'sequential' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('sequential')}
              >
                Step by Step
              </Button>
              <Button 
                variant={viewMode === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setViewMode('all')}
              >
                Show All
              </Button>
            </div>
          </div>
          
          {/* Sequential View */}
          {viewMode === 'sequential' && fields.map((field, index) => (
            <div 
              key={field.id} 
              className={`${index === currentQuestionIndex ? 'block' : 'hidden'} transition-all duration-300`}
            >
              <Card className={`relative ${getCardAnimationClasses(field.id, index)}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="w-full pr-8">
                    <p className="text-lg font-semibold">
                      {index + 1}. {field.question}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full flex-shrink-0 -mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteQuestion(field.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-red-500">
                      <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    {field.type === 'CHOICES' && field.options && field.options.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {field.options.map((option, optionIndex) => (
                            <Button 
                              key={optionIndex}
                              variant={answers[field.id] === option ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAnswerChange(field.id, option)}
                              className="mr-2 mb-2"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or enter a custom answer:</div>
                          <Textarea
                            placeholder="Your custom answer..."
                            className="min-h-24"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'DATE' ? (
                      <div className="space-y-2">
                        <Input
                          type="date"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or describe the date in words:</div>
                          <Textarea
                            placeholder="Describe the date..."
                            className="min-h-16"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'TIME' ? (
                      <div className="space-y-2">
                        <Input
                          type="time"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or describe the time in words:</div>
                          <Textarea
                            placeholder="Describe the time..."
                            className="min-h-16"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'NUMBER' ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Your answer..."
                        className="min-h-24"
                        value={answers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  {currentQuestionIndex > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  <div className="flex-1 flex justify-center">
                    <ToneSelector />
                  </div>
                  <Button 
                    onClick={() => handleNextQuestion(index, answers[field.id] || '')}
                    disabled={!answers[field.id]}
                  >
                    {index === fields.length - 1 ? 'Generate Email' : 'Next Question'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
          
          {/* All Questions View */}
          {viewMode === 'all' && (
            <div className="space-y-6 w-full">
              {fields.map((field, index) => (
                <Card 
                  key={field.id} 
                  className={`w-full transition-all duration-300 ${getCardAnimationClasses(field.id, index)}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="w-full pr-8">
                        <p className="text-lg font-semibold">
                          {index + 1}. {field.question}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full mt-1 flex-shrink-0"
                        onClick={() => handleDeleteQuestion(field.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-red-500">
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {field.type === 'CHOICES' && field.options && field.options.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {field.options.map((option, optionIndex) => (
                            <Button 
                              key={optionIndex}
                              variant={answers[field.id] === option ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleAnswerChange(field.id, option)}
                              className="mr-2 mb-2"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or enter a custom answer:</div>
                          <Textarea
                            placeholder="Your custom answer..."
                            className="min-h-16 w-full resize-none"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'DATE' ? (
                      <div className="space-y-2">
                        <Input
                          type="date"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or describe the date in words:</div>
                          <Textarea
                            placeholder="Describe the date..."
                            className="min-h-16 w-full resize-none"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'TIME' ? (
                      <div className="space-y-2">
                        <Input
                          type="time"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 mb-1">Or describe the time in words:</div>
                          <Textarea
                            placeholder="Describe the time..."
                            className="min-h-16 w-full resize-none"
                            value={answers[field.id] || ''}
                            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ) : field.type === 'NUMBER' ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          className="w-full"
                          value={answers[field.id] || ''}
                          onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                        />
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Your answer..."
                        className="min-h-24 w-full resize-none"
                        value={answers[field.id] || ''}
                        onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-end items-center gap-3 mt-6">
                <ToneSelector />
                <Button 
                  onClick={handleSubmitAllAnswers}
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Email'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Email View */}
      {generatedEmail && (
        <div className="max-w-4xl w-full mx-auto">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Generated Email</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(updatedEmail === 'loading' ? '' : updatedEmail);
                      // Could add a toast notification here
                    }}
                    disabled={generatedEmail === 'loading'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {generatedEmail === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Generating your email...</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">This may take a few moments</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-800 rounded-md w-full">
                  {updatedEmail}
                </div>
              )}
            </CardContent>
            
            {/* Placeholder section moved outside the card */}
            {placeholders.length > 0 && generatedEmail !== 'loading' && (
              <div className="mt-6 max-w-4xl w-full mx-auto">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Replace Placeholders</CardTitle>
                    <CardDescription>
                      Fill in the values for the placeholders found in your email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {placeholders.map((placeholder, index) => (
                        <div key={index} className="mb-3">
                          <label className="block text-sm font-medium mb-1">
                            {placeholder.text.replace('[', '').replace(']', '')}
                          </label>
                          <div className="flex gap-2">
                            <Input
                              value={placeholder.replacement}
                              onChange={(e) => replacePlaceholder(index, e.target.value)}
                              placeholder={`Replace ${placeholder.text}`}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={updateEmailWithReplacements}
                      className="w-full"
                    >
                      Update Email
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
} 