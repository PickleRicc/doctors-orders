import { Inter } from 'next/font/google';

// Configure Inter font for a clean, modern look that works well with medical and AI applications
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});
