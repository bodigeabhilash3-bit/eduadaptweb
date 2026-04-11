import type { Metadata, Viewport } from 'next'
import { Nunito, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: '--font-sans'
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-heading'
});

export const metadata: Metadata = {
  title: 'EduAdapt - AI-Powered Adaptive Learning Platform',
  description: 'Adaptive entrance exam preparation platform with AI-powered study plans, mood-driven difficulty adjustment, and personalized learning for Mathematics, Physics, and Chemistry.',
  keywords: ['education', 'entrance exam', 'MPC', 'Mathematics', 'Physics', 'Chemistry', 'study plan', 'AI learning', 'adaptive learning'],
}

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${nunito.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

