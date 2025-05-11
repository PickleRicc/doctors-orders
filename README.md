# Doctors Orders

An AI-powered medical note-taking application built with Next.js that helps healthcare professionals save time on documentation through real-time voice dictation and AI-assisted SOAP notes generation.

## Features

- **Voice Dictation**: Create medical notes using voice recognition technology
- **AI-Assisted SOAP Notes**: Automatically structure notes in the SOAP format
- **Dashboard**: Track your note-taking activity and usage
- **Secure Authentication**: Powered by Supabase for secure user management
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Shadow Black with Royal Blue accents for reduced eye strain

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Backend**: Supabase for authentication and non-PHI storage
- **Styling**: Tailwind CSS with custom theming
- **Icons**: Lucide React

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment

This application is deployed on Vercel. The easiest way to deploy your own instance is to use the [Vercel Platform](https://vercel.com/new) and connect it to your GitHub repository.
