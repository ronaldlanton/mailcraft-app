import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="flex flex-col">
      <main className="flex-grow container mx-auto px-4">
        {/* Hero section taking full viewport height */}
        <section className="min-h-[calc(100vh-6rem)] flex flex-col justify-center">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Craft Perfect Emails with AI
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Write professional, well-structured emails faster and respond to emails with confidence using our AI-powered assistant.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              <Link href="/craft" className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-full cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Craft New Email</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-center">
                        Use AI to create a perfect email from scratch.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/breakdown" className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300 h-full cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Breakdown & Reply</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-center">
                        Analyze emails and craft the perfect response.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features section now below the full-height hero */}
        <section id="features" className="py-16 md:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Leverage advanced AI models to generate high-quality email content tailored to your needs.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Time-Saving</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Reduce the time spent drafting emails by up to 80% while maintaining professional quality.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ensure your emails are well-structured, clear, and professionally written every time.
              </p>
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="py-16 md:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Choose Your Mode</h4>
                    <p className="text-gray-600 dark:text-gray-300">Select whether you need to craft a new email or respond to an existing one.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Provide Input</h4>
                    <p className="text-gray-600 dark:text-gray-300">Enter your email idea or paste the email you need to respond to.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Answer Questions</h4>
                    <p className="text-gray-600 dark:text-gray-300">Provide answers to the AI-generated guiding questions about your email.</p>
                  </div>
          </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">4</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Get Your Email</h4>
                    <p className="text-gray-600 dark:text-gray-300">Receive a professionally written email ready to send or customize further.</p>
                  </div>
          </li>
        </ol>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <div className="aspect-w-16 aspect-h-9 bg-white dark:bg-gray-700 rounded-md flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-center p-12">
                  [Application interface preview]
                </p>
              </div>
            </div>
        </div>
        </section>
      </main>
    </div>
  )
}
