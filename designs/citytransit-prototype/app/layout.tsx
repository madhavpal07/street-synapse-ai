import type {Metadata, Viewport} from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sawaari',
  description: 'AI-Powered Live Bus Tracking & Commuter Web App',
  openGraph: {
    title: 'Sawaari',
    description: 'AI-Powered Live Bus Tracking & Commuter Web App',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sawaari',
    description: 'AI-Powered Live Bus Tracking & Commuter Web App',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
        <div className="w-full max-w-[520px] mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
