import { Roboto } from "next/font/google";
import "./globals.css";

// Load Roboto font
const roboto = Roboto({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
  // Including the full range of weights
  weight: ["100", "300", "400", "500", "700", "900"],
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
        {/* Fonts are loaded through Next.js font optimization */}
      </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
