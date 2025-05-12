import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Load Plus Jakarta Sans font
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  // Including the full range of weights
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  // Including italic styles
  style: ['normal', 'italic'],
});

// Metadata for the application
export const metadata = {
  title: "Doctors Orders - AI-Powered Medical Note-Taking",
  description: "Save hours on documentation with real-time voice dictation and AI-assisted SOAP notes generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Cal Sans is loaded via a regular stylesheet link */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap" rel="stylesheet" />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
