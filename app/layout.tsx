import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Organic Marketing Agent',
  description: 'Generate viral marketing assets for your digital products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
