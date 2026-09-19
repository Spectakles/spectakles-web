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
- **Backend / Services**: Supabase (Waitlist & Blog Sync), Firebase Analytics & Google Gemini Multimodal APIs
- **Admin CMS**: Custom secure blog editorial suite with SEO preview engines & JSON-LD structured schemas

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
│   │   ├── admin/page.tsx      # Admin Blog CMS & Editorial Management Panel
│   │   ├── api/                # API route handlers
│   │   │   ├── admin/          # Admin authentication, session check & logout
│   │   │   └── blogs/          # Blog CRUD endpoints & slug-specific APIs
│   │   ├── blog/               # Insights blog
│   │   │   ├── [slug]/page.tsx # Dynamic SEO article reader with JSON-LD schema
│   │   │   └── page.tsx        # Dynamic blog index with category filters & search
│   │   ├── faq/page.tsx        # Frequently asked questions
│   │   ├── impact/page.tsx     # Institutional impact & case studies
│   │   ├── pricing/page.tsx    # Pricing & institution tiers
│   │   ├── globals.css         # Global stylesheets & design tokens
│   │   ├── layout.tsx          # Root layout, metadata & global background
│   │   └── page.tsx            # Home landing page
│   ├── components/             # Reusable UI & interactive components
│   │   ├── admin/              # Blog editor, dashboard & SEO simulator
│   │   └── blog/               # Dynamic article reader with TOC & link renderer
│   ├── data/                   # Seed articles & static data models
│   ├── lib/                    # Blog store, auth HMAC crypto, Supabase & Firebase
│   └── styles/                 # Specialized component animation stylesheets
├── .env.example                # Environment variables template
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS theme extension
└── tsconfig.json               # TypeScript path aliases (@/*)
```

---

## Admin Blog CMS Panel

Spectakles Web includes an integrated, production-grade Editorial Content Management System for publishing and optimizing articles.

### Access & Default Credentials

Navigate to `/admin` in your browser:

- **URL**: `http://localhost:3000/admin`
- **Default Email**: `admin@spectakles.in` (configurable via `ADMIN_EMAIL`)
- **Default Password**: `spectakles2026!admin` (configurable via `ADMIN_PASSWORD`)

### CMS Capabilities

1. **Rich Block Content Builder**:
   - Create and arrange Headings (H2/H3), Paragraphs, Blockquotes, and Bullet Lists.
   - Embed inline hyperlinks formatted as `[Anchor Text](https://link.com)` or bare URLs, automatically rendered as accessible links.
2. **Media & Image Integration**:
   - Direct image URL entry or one-click Unsplash presets.
   - Image file uploader with base64 data conversion for instant local asset embedding.
3. **Real-time SEO Simulation**:
   - **Google SERP Snippet Preview**: Displays real-time desktop/mobile search card rendering with character limit warnings.
   - **OpenGraph & Twitter Card Preview**: Previews high-impact 1200x630 social sharing cards.
4. **Structured Data & Discoverability**:
   - Automatically generates `<script type="application/ld+json">` with `schema.org/BlogPosting` specifications.
   - Dynamic canonical URL tags and keyword meta-injection.
5. **Persistent Storage & Cloud Sync**:
   - Stores articles in `data/blogs.json` locally and synchronously backs up to Supabase if configured.

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

Fill in your admin credentials, Supabase, and Firebase keys (optional in development; fallbacks enabled).

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
