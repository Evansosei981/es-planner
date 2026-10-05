# ES Planner (React Edition)

A high-performance university schedule, study planner, exam tracker, and AI academic assistant rewritten as a modern React application with Vite, Tailwind CSS, and Node.js.

Imported and migrated from [Evansosei981/es-planner](https://github.com/Evansosei981/es-planner).

## Core Features

- **Device Hardware ID Activation & Security**:
  - Secure hardware identifier generation (`A7B-9X2` format)
  - Salted SHA-256 activation key verification matching the original security architecture
  - Direct WhatsApp link for activation verification
  - Secret 7-tap admin unlock trigger leading to the Admin Key Generator (master password: `Evans`)
- **Onboarding & Personalization**:
  - Interactive onboarding flow highlighting study scheduling, exam alerts, and weekly goals
  - Student profile setup with customizable name, major, and advance notification timing
  - Interactive app walkthrough tour
- **Schedule Management**:
  - Weekly schedule selector covering all 7 days with quick day-pills and course indicators
  - Class timetable cards with lecturer, room, and start/end times
  - Upcoming Exams tracker with real-time countdowns and urgency badges
  - Class note and video attachment logging
- **Study Planner & Focus Timer**:
  - Dedicated study session scheduling grouped by weekday
  - One-tap session completion toggles
  - Full-screen animated circular focus countdown timer
  - Session start chime (`study_starting.wav`) and break chime (`study_break.wav`) audio cues
  - Post-session reflection note and journal logger
- **Learning Journal**:
  - Categorized class notes (`COURSE`) and study reflections (`STUDY_SESSION`)
  - Support for media/video attachments and rich notes
- **Visual Progress & Analytics**:
  - Circular weekly study progress ring with animated sweep gradient
  - Per-course study hours breakdown charts
  - Celebratory confetti explosion when weekly study target is reached
- **Evans AI Assistant**:
  - Embedded AI academic drawer with multi-session chat history
  - Powered by Google Gemini (`gemini-3.8-flash`) through a secure server-side proxy
  - Expert mathematics step-by-step reasoning persona using standard Unicode notation
- **Profile & Appearance**:
  - Dark, Light, and System theme preferences
  - Standard chime and custom voice reminder mode toggles
  - Profile avatar upload and storage

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, `@google/genai` TypeScript SDK
- **Build Tool**: Vite 6, tsx
