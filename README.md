<div align="center">

# Spectakles Web

### Make every voice in the room count

![Platform](https://img.shields.io/badge/Platform-Next.js%2015-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC)

</div>

**Spectakles** turns group discussions, practice sessions, and presentations into confident, measurable moments of participation for educational institutions. Designed to replace the pressure of cold calls with low-stakes, high-energy practice, Spectakles pairs private preparation spaces with structured live rounds, automated coach nudges, and instant session feedback recaps.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **Animations**: GSAP (GreenSock) + Canvas/WebGL particle systems
- **Icons**: Lucide React
- **Backend / Services**: Supabase (Waitlist), Firebase Analytics & Google Gemini Multimodal APIs

---

## Project Structure

```
├── public/                     # Static public assets (SVGs, PNGs, Roundtable preview)
│   ├── assets/                 # Brand logos and illustration assets
│   ├── favicon.svg             # Application favicon
│   ├── og-image.png            # OpenGraph social share card
│   └── roundtable.html         # Interactive live roundtable mock preview
├── src/
│   ├── app/                    # Next.js App Router routes & layouts
│   │   ├── about/page.tsx      # About Spectakles
│   │   ├── blog/               # Insights blog
│   │   │   ├── [slug]/page.tsx # Dynamic article reader
│   │   │   └── page.tsx        # Blog index
│   │   ├── faq/page.tsx        # Frequently asked questions
│   │   ├── impact/page.tsx     # Institutional impact & case studies
│   │   ├── pricing/page.tsx    # Pricing & institution tiers
│   │   ├── globals.css         # Global stylesheets & design tokens
│   │   ├── layout.tsx          # Root layout, metadata & global background
│   │   └── page.tsx            # Home landing page
│   ├── components/             # Reusable UI & interactive components
│   ├── data/                   # Blog articles & static data models
│   ├── lib/                    # Supabase client & Firebase analytics
│   └── styles/                 # Specialized component animation stylesheets
├── .env.example                # Environment variables template
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS theme extension
└── tsconfig.json               # TypeScript path aliases (@/*)
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or newer (tested on `v24.18.0`)
- **npm**: `v9.0.0` or newer

### Installation

1. Clone repository & install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase and Firebase keys (optional in development; fallbacks enabled).

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

To build the application for production:

```bash
npm run build
npm run start
```
