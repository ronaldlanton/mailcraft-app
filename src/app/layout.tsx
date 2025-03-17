import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ProfileMenu } from "@/components/profile-menu";
import { ProfileProvider } from "@/context/profile-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MailCraft - AI-Powered Email Assistant",
  description: "Craft perfect emails and replies with the help of AI. Save time and write professional emails effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProfileProvider>
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
              <header className="fixed top-0 left-0 right-0 w-full z-10 backdrop-blur-sm bg-transparent">
                <div className="container mx-auto py-6">
                  <div className="flex justify-between items-center">
                    <Link href="/">
                      <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">MailCraft</h1>
                    </Link>
                    <div className="flex items-center">
                      <nav className="mr-8">
                        <ul className="flex gap-6">
                          <li><Link href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Features</Link></li>
                          <li><Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">How it works</Link></li>
                        </ul>
                      </nav>
                      <ProfileMenu />
                    </div>
                  </div>
                </div>
              </header>
              <main className="flex-grow pt-24">{children}</main>
              <footer className="bg-gray-100 dark:bg-gray-900 py-6">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      © {new Date().getFullYear()} MailCraft. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                      <Link href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                        Privacy Policy
                      </Link>
                      <Link href="#" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                        Terms of Service
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
