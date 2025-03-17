'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clipboard, ClipboardCheck } from 'lucide-react'
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
  emailContent: string
  questionItems: QuestionItem[]
}

export default function BreakdownReply() {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedReply, setGeneratedReply] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [emailTone, setEmailTone] = useState<string>('Professional')
  const [placeholders, setPlaceholders] = useState<{text: string, replacement: string}[]>([])
  const [updatedReply, setUpdatedReply] = useState('')
  
  // Extract placeholders from generated reply
  useEffect(() => {
    if (generatedReply && generatedReply !== 'loading') {
      // Find all text within square brackets
      const regex = /\[(.*?)\]/g;
      const matches = [...generatedReply.matchAll(regex)];
      
      if (matches.length > 0) {
        const newPlaceholders = matches.map(match => ({
          text: match[0], // The full match including brackets
          replacement: '' // Empty replacement initially
        }));
        setPlaceholders(newPlaceholders);
        setUpdatedReply(generatedReply);
      } else {
        setPlaceholders([]);
        setUpdatedReply(generatedReply);
      }
    }
  }, [generatedReply]);
  
  // Function to replace placeholders in the reply
  const replacePlaceholder = (index: number, value: string) => {
    const newPlaceholders = [...placeholders];
    newPlaceholders[index].replacement = value;
    setPlaceholders(newPlaceholders);
  };
  
  // Function to update the reply with all replacements
  const updateReplyWithReplacements = () => {
    let newReply = updatedReply;
    
    placeholders.forEach(placeholder => {
      if (placeholder.replacement) {
        newReply = newReply.replace(placeholder.text, placeholder.replacement);
      }
    });
    
    setUpdatedReply(newReply);
  };
  
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
  );
  
  const { register, handleSubmit, watch, control, reset, setValue } = useForm<FormData>({
    defaultValues: {
      emailContent: '',
      questionItems: []
    }
  })
  
  const { fields, replace } = useFieldArray({
    control,
    name: 'questionItems'
  })

  const breakdownEmail = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze this email and extract EXACTLY the questions and key points that need to be addressed in a reply:

${data.emailContent}

For each question or key point, use the EXACT text from the email in this format:
[QUESTION]: (Copy the EXACT text of questions or key points from the email)
[TYPE]: (TEXT, CHOICES, DATE, TIME, or NUMBER)
[OPTIONS]: (For CHOICES only, provide 4-6 creative, diverse options that represent different approaches to responding)
[END]

IMPORTANT: 
1. Use the EXACT wording from the email for each question or point - do not rephrase or summarize
2. If there's a direct question in the email like "When can we meet?" use that exact text as the [QUESTION]
3. For statements that need a response but aren't questions, use the exact text from the email
4. Always include options for CHOICES type questions

Examples:
If the email says: "When can we meet to discuss the project?"
Use: [QUESTION]: When can we meet to discuss the project?

If the email says: "I need your feedback on the budget proposal."
Use: [QUESTION]: I need your feedback on the budget proposal.

If the email says: "Please let me know if you're available next week."
Use: [QUESTION]: Please let me know if you're available next week.`,
          type: 'breakdown'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to breakdown email')
      }

      const result = await response.json()
      
      // Parse the structured content into questions with metadata
      const content = result.content
      
      // First, check if we have [QUESTION] tags at all
      if (!content.includes('[QUESTION]:')) {
        // Fallback: generate basic questions from unstructured content
        const fallbackQuestions = generateFallbackQuestions(content, data.emailContent);
        replace(fallbackQuestions);
        return;
      }
      
      const questionBlocks = content.split('[QUESTION]:')
        .slice(1) // Skip the empty first element
        .map((block: string) => {
          // Make sure the block has an end marker, otherwise add one
          const processedBlock = block.includes('[END]') ? block : block + '[END]';
          
          // Find the end of the question text more robustly
          let questionEndIndex = processedBlock.length;
          const possibleEndMarkers = ['[TYPE]:', '[OPTIONS]:', '[DEFAULT]:', '[END]'];
          
          for (const marker of possibleEndMarkers) {
            const idx = processedBlock.indexOf(marker);
            if (idx !== -1 && idx < questionEndIndex) {
              questionEndIndex = idx;
            }
          }
          
          const question = processedBlock.substring(0, questionEndIndex).trim();
          
          // Extract type
          let type = 'TEXT'; // Default type
          if (processedBlock.includes('[TYPE]:')) {
            const typeStartIndex = processedBlock.indexOf('[TYPE]:') + '[TYPE]:'.length;
            let typeEndIndex = processedBlock.length;
            
            for (const marker of ['[OPTIONS]:', '[DEFAULT]:', '[END]']) {
              const idx = processedBlock.indexOf(marker, typeStartIndex);
              if (idx !== -1 && idx < typeEndIndex) {
                typeEndIndex = idx;
              }
            }
            
            type = processedBlock.substring(typeStartIndex, typeEndIndex).trim().toUpperCase();
          }
          
          // Extract options for CHOICES type
          let options: string[] = [];
          if (type === 'CHOICES' && processedBlock.includes('[OPTIONS]:')) {
            const optionsStartIndex = processedBlock.indexOf('[OPTIONS]:') + '[OPTIONS]:'.length;
            let optionsEndIndex = processedBlock.length;
            
            for (const marker of ['[DEFAULT]:', '[END]']) {
              const idx = processedBlock.indexOf(marker, optionsStartIndex);
              if (idx !== -1 && idx < optionsEndIndex) {
                optionsEndIndex = idx;
              }
            }
            
            const optionsText = processedBlock.substring(optionsStartIndex, optionsEndIndex).trim();
            
            // Try different parsing strategies
            // First try comma-separated format
            let parsedOptions = optionsText.split(',').map(opt => opt.trim()).filter(Boolean);
            
            // If that didn't work well, try bullet points
            if (parsedOptions.length <= 1 && (optionsText.includes('- ') || optionsText.includes('• '))) {
              parsedOptions = optionsText
                .split(/\n\s*[-•]\s+/)
                .map(opt => opt.trim())
                .filter(Boolean);
            }
            
            // If that still didn't work, try newlines
            if (parsedOptions.length <= 1 && optionsText.includes('\n')) {
              parsedOptions = optionsText
                .split('\n')
                .map(opt => opt.trim())
                .filter(Boolean);
            }
            
            // Clean up options - remove quotes and other formatting
            options = parsedOptions.map(opt => {
              // Remove quotes
              let cleaned = opt.replace(/^["']|["']$/g, '');
              // Remove any leading indicators like "Option 1: " or "1. "
              cleaned = cleaned.replace(/^(\d+\.|\w+\s*\d+:)\s+/i, '');
              return cleaned;
            });
            
            // If no options were found but this is a CHOICES type, add some defaults
            if (options.length === 0) {
              options = ['Yes', 'No', 'Maybe', 'Need more information'];
            }
            
            // Limit to reasonable number of options
            if (options.length > 8) {
              options = options.slice(0, 8);
            }
          } else if (type === 'CHOICES') {
            // If it's a CHOICES type but no options section, add defaults
            options = ['Yes', 'No', 'Maybe', 'Need more information'];
          }
          
          // Extract default value if provided
          let defaultValue = '';
          if (processedBlock.includes('[DEFAULT]:')) {
            const defaultStartIndex = processedBlock.indexOf('[DEFAULT]:') + '[DEFAULT]:'.length;
            let defaultEndIndex = processedBlock.length;
            
            for (const marker of ['[END]']) {
              const idx = processedBlock.indexOf(marker, defaultStartIndex);
              if (idx !== -1 && idx < defaultEndIndex) {
                defaultEndIndex = idx;
              }
            }
            
            defaultValue = processedBlock.substring(defaultStartIndex, defaultEndIndex).trim();
          }
          
          return {
            question: question || 'How should I respond to this point?', // Fallback question if empty
            type,
            options,
            default: defaultValue
          };
        });
      
      // Filter out any items with empty questions (shouldn't happen with our fallback, but just in case)
      const validQuestionBlocks = questionBlocks.filter((item: { question: string }) => item.question.trim() !== '');
      
      // If no valid questions were found, generate fallbacks
      if (validQuestionBlocks.length === 0) {
        const fallbackQuestions = generateFallbackQuestions(content, data.emailContent);
        replace(fallbackQuestions);
        return;
      }
      
      // Convert to question items
      const questionItems = validQuestionBlocks.map((item: any, index: number) => ({
        id: `q-${index}`,
        question: item.question,
        answer: item.default || '',
        type: item.type,
        options: item.options
      }));
      
      // Ensure all CHOICES questions have options
      const enhancedQuestionItems = ensureChoicesHaveOptions(questionItems);
      
      // Replace the field array with new items
      replace(enhancedQuestionItems);
    } catch (error) {
      console.error('Error:', error)
      // Generate fallback questions in case of error
      const fallbackQuestions = generateBasicQuestions(data.emailContent);
      replace(fallbackQuestions);
      alert('There was an issue analyzing the email, but we\'ve generated some basic questions to help you respond.');
    } finally {
      setIsLoading(false)
    }
  }
  
  // Helper function to generate fallback questions from unstructured content
  const generateFallbackQuestions = (content: string, originalEmail: string) => {
    // Try to extract potential questions from the content
    const sentences = content.split(/[.!?]\s+/);
    const potentialQuestions = sentences
      .filter(s => s.includes('?') || s.toLowerCase().includes('how') || s.toLowerCase().includes('what') || s.toLowerCase().includes('when'))
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    // If we can extract some questions, use them
    if (potentialQuestions.length >= 3) {
      return potentialQuestions.slice(0, 5).map((q, index) => ({
        id: `q-${index}`,
        question: q.endsWith('?') ? q : `${q}?`,
        answer: '',
        type: 'TEXT',
        options: []
      }));
    }
    
    // Otherwise, fall back to basic questions
    return generateBasicQuestions(originalEmail);
  }
  
  // Helper function to generate basic questions from the email content
  const generateBasicQuestions = (emailContent: string) => {
    return [
      {
        id: 'q-0',
        question: 'What are the main points I should address in my reply?',
        answer: '',
        type: 'TEXT',
        options: []
      },
      {
        id: 'q-1',
        question: 'What tone should I use in my response?',
        answer: '',
        type: 'CHOICES',
        options: ['Professional', 'Friendly', 'Formal', 'Casual', 'Direct']
      },
      {
        id: 'q-2',
        question: 'Is there any specific action I need to take?',
        answer: '',
        type: 'CHOICES',
        options: ['Yes, immediate action required', 'Schedule follow-up', 'Provide more information', 'No action needed']
      },
      {
        id: 'q-3',
        question: 'When should I respond by?',
        answer: '',
        type: 'DATE',
        options: []
      }
    ];
  }

  // Helper function to ensure all CHOICES questions have options
  const ensureChoicesHaveOptions = (questions: QuestionItem[]): QuestionItem[] => {
    return questions.map(q => {
      if (q.type === 'CHOICES' && (!q.options || q.options.length === 0)) {
        // Add default options based on the question content
        if (q.question.toLowerCase().includes('tone')) {
          q.options = ['Professional', 'Friendly', 'Formal', 'Casual', 'Direct'];
        } else if (q.question.toLowerCase().includes('action') || q.question.toLowerCase().includes('do')) {
          q.options = ['Yes, immediate action required', 'Schedule follow-up', 'Provide more information', 'No action needed'];
        } else if (q.question.toLowerCase().includes('agree') || q.question.toLowerCase().includes('accept')) {
          q.options = ['Fully agree', 'Agree with conditions', 'Partially agree', 'Need more information', 'Disagree'];
        } else {
          q.options = ['Yes', 'No', 'Maybe', 'Need more information'];
        }
      }
      return q;
    });
  }

  const generateReply = async (data: FormData) => {
    setIsLoading(true)
    setGeneratedReply('loading') // Set a loading state to show the panel
    
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
      const prompt = `Generate a well-structured reply to an email based on the following information:
      
ORIGINAL EMAIL: ${data.emailContent}

KEY POINTS TO ADDRESS:
${questionAnswers}

TONE: ${emailTone}

SENDER INFO:
Name: ${profile.name}
Email: ${profile.email}

Create a ${emailTone.toLowerCase()} email reply with appropriate greeting, body, and sign-off.`

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
        throw new Error('Failed to generate reply')
      }

      const result = await response.json()
      setGeneratedReply(result.content)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate reply. Please try again.')
      setGeneratedReply('') // Reset on error
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (updatedReply && updatedReply !== 'loading') {
      navigator.clipboard.writeText(updatedReply);
      setIsCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <div className="container mx-auto py-8 flex flex-col min-h-[calc(100vh-14rem)] justify-center">
      {!fields.length && !generatedReply && (
        <div className="max-w-2xl w-full mx-auto">
          <div className="relative mb-4">
            <Link href="/" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 absolute left-0 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-center">Breakdown & Reply to an Email</h1>
          </div>
          <Card className="w-full">
            <CardContent className="p-4">
              <form onSubmit={handleSubmit(breakdownEmail)}>
                <Textarea
                  placeholder="Paste the email you received here. We'll break it down into key points for you to address."
                  className="min-h-32 w-full resize-none"
                  {...register('emailContent')}
                />
                <div className="flex justify-center mt-4">
                  <Button 
                    type="submit" 
                    className="w-1/3"
                    disabled={isLoading || !watch('emailContent')}
                  >
                    {isLoading ? 'Breaking down...' : 'Breakdown Email'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {fields.length > 0 && !generatedReply && (
        <div className="max-w-4xl w-full mx-auto">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle>Address these points in your reply</CardTitle>
              <CardDescription>
                Answer each question or point to generate a comprehensive reply
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(generateReply)}>
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-6 w-full">
                    <label className="block text-sm font-medium mb-2">
                      {index + 1}. {field.question}
                    </label>
                    
                    {field.type === 'CHOICES' && field.options && field.options.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {field.options.map((option, optionIndex) => (
                            <Button 
                              key={optionIndex}
                              type="button"
                              variant={watch(`questionItems.${index}.answer`) === option ? "default" : "outline"}
                              size="sm"
                              onClick={() => setValue(`questionItems.${index}.answer`, option)}
                              className={`mr-2 mb-1 ${
                                watch(`questionItems.${index}.answer`) === option 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900'
                              }`}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                        <Input
                          {...register(`questionItems.${index}.answer`)}
                          placeholder="Your response or select an option above..."
                          className="w-full"
                        />
                      </div>
                    ) : field.type === 'DATE' ? (
                      <div className="space-y-2">
                        <Input
                          type="date"
                          {...register(`questionItems.${index}.answer`)}
                          className="w-full"
                        />
                      </div>
                    ) : field.type === 'TIME' ? (
                      <div className="space-y-2">
                        <Input
                          type="time"
                          {...register(`questionItems.${index}.answer`)}
                          className="w-full"
                        />
                      </div>
                    ) : field.type === 'NUMBER' ? (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          {...register(`questionItems.${index}.answer`)}
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <Input
                        {...register(`questionItems.${index}.answer`)}
                        placeholder="Your response..."
                        className="w-full"
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <ToneSelector />
                  <Button 
                    type="submit" 
                    className="w-1/3"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate Reply'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {generatedReply && (
        <div className="max-w-4xl w-full mx-auto">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Reply</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={generatedReply === 'loading'}
                  >
                    {isCopied ? (
                      <>
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Start over
                      setGeneratedReply('')
                      setPlaceholders([])
                      setUpdatedReply('')
                      reset({
                        emailContent: '',
                        questionItems: []
                      })
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Start Over
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {generatedReply === 'loading' ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Generating your reply...</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">This may take a few moments</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-800 rounded-md w-full">
                  {updatedReply}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Placeholder section moved outside the card */}
      {placeholders.length > 0 && generatedReply && generatedReply !== 'loading' && (
        <div className="mt-6 max-w-4xl w-full mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Replace Placeholders</CardTitle>
              <CardDescription>
                Fill in the values for the placeholders found in your reply.
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
                onClick={updateReplyWithReplacements}
                className="w-full"
              >
                Update Reply
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
} 