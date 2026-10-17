<div align="center">

# Spectakles

### Make every voice in the room count

![Platform](https://img.shields.io/badge/Platform-Web-4CAF50)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-16-000000)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC)

</div>

**Spectakles** turns group discussions, practice sessions, and presentations into confident, measurable moments of participation for educational institutions. Designed to replace the pressure of cold calls with low-stakes, high-energy practice, Spectakles pairs private preparation spaces with structured live rounds, automated coach nudges, and instant session feedback recaps.

---

## Features

- **Structured Discussion Rounds** — Time-boxed, purposeful speaking rounds tailored for placement prep, classroom discussions, and team communication skills.
- **Private Preparation Space** — Dedicated prep notepad allowing learners to formulate points, structure questions, and collect thoughts before speaking.
- **Live Facilitation & Nudges** — Non-intrusive coach prompts and speaking cues that keep discussions engaging and invite quieter participants to contribute.
- **Instant Session Snapshots** — Automated post-round recaps analyzing talk time, turn distribution, positive contributions, and constructive suggestions for next time.
- **Institutional Impact Tracking** — Analytics dashboards designed for faculty, placement officers, and student success leads to measure cohort-wide confidence growth.
- **Interactive Tour & Demo Booking** — Built-in institutional walkthrough request flows and live previews.

---

## Prerequisites

Ensure your environment meets the following requirements before getting started:

- **Node.js**: `v20.9.0` or newer (LTS recommended; tested on `v26.0.0`)
- **npm**: `v9.0.0` or newer (tested on `v11.12.1`)
- **Web Browser**: Modern evergreen browser (Chrome, Firefox, Safari, Edge)

---

## Usage

### Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Once running, visit [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Compile and bundle production-optimized assets:

```bash
npm run build
```

The production build is generated in `.next/`. Run `npm start` to serve it.

### Preview Production Build

Serve the built application locally to verify the production artifact:

```bash
npm run preview
```

---

## Configuration

| Configuration | File | Details |
| :--- | :--- | :--- |
| **Path Alias** | `tsconfig.json` | Uses `@/` to alias the `./src` directory |
| **CSS & Styles** | `tailwind.config.js`, `postcss.config.js` | Tailwind CSS utility classes and PostCSS autoprefixing |
| **TypeScript** | `tsconfig.json` | Strict type checking targeting ES2020 and DOM |
| **Linting** | `eslint.config.js` | ESLint 9 flat configuration with React hooks rules |

*(Note: No mandatory environment variables (`.env`) are currently required to run the client-side application)*

---

## Project Structure

```
spectackle-product/
├── public/                 # Original public resources and unchanged logo copies
├── src/
│   ├── app/                # Next.js App Router, document head, persistent shell
│   ├── components/         # Existing UI, animations, navigation, and waitlist
│   ├── views/              # Existing view source, including inactive views
│   ├── assets/             # Original source assets and roundtable HTML/CSS
│   ├── lib/                # Supabase and Firebase integrations
│   └── index.css           # Unchanged global styles and Tailwind directives
├── scripts/                # Generates TypeScript exports for raw iframe assets
├── generated/              # Generated raw asset module (ignored)
├── next.config.ts          # Next.js configuration
├── package.json
├── postcss.config.js       # Unchanged PostCSS configuration
├── tailwind.config.js      # Unchanged Tailwind theme
└── tsconfig.json
```

---

## Search metadata

`src/lib/seo.ts` defines route-specific titles, descriptions, canonical URLs, social metadata, and structured data. The canonical origin is `https://www.spectakles.in`, matching the live domain redirect. Home, About, and FAQ export their own metadata through the App Router.

Empty fallback pages retain their existing appearance and receive `noindex`; Vercel preview builds also receive `noindex`. Public robots, sitemap, and llms.txt files use the same canonical host. The square PNG icons are rendered from the original SVG artwork.

## Quality & Verification

Run the following checks to validate code quality and typing:

```bash
# Run TypeScript type checks
npm run typecheck

# Run ESLint validation
npm run lint
```

The migration preserves existing lint findings rather than changing unrelated component logic. `npm run lint` currently reports those findings. Browser verification tools live in the repository-level `verification/` directory; pixel comparison is deferred for the first framework conversion pass.

---

## Deployment

Deploy as a Next.js application with `spectackle-product` as the project root. On Vercel, use the Next.js framework preset; `vercel.json` no longer rewrites requests to `index.html`. For a Node host, install with `npm ci`, build with `npm run build`, and serve with `npm start` (default port 3000).

The live routes remain `/`, `/about`, and `/faq`. Other paths retain the original shared shell and empty main content. Files in `src/views` do not automatically become routes.

Copy `.env.example` to `.env.local` when configuring integrations. The former `VITE_*` public keys now use `NEXT_PUBLIC_*`; set them before building, as Next.js embeds public values in the browser bundle. Never put private credentials in those variables. Without configuration, the existing demo waitlist and analytics fallback remain available.

The original font URLs, stylesheets, Tailwind theme, image assets, animation parameters, and copy are retained. Roundtable HTML/CSS exports regenerate automatically before development and production builds.
---

## Contributing

1. Fork the repository.
2. Create a dedicated branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Ensure all type checks and lint checks pass:
   ```bash
   npm run typecheck && npm run lint
   ```
4. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add your feature description"
   ```
5. Push to your branch and open a Pull Request against `main`.

---

## License

No license has been specified for this repository yet. All rights are reserved by default. If you plan to make this project open-source, consider adding an [MIT](https://opensource.org/licenses/MIT) or [Apache-2.0](https://opensource.org/licenses/Apache-2.0) `LICENSE` file.
