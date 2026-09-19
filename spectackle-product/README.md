<div align="center">

# Spectakles

### Make every voice in the room count

![Platform](https://img.shields.io/badge/Platform-Web-4CAF50)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)
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

- **Node.js**: `v18.0.0` or newer (LTS recommended; tested on `v26.0.0`)
- **npm**: `v9.0.0` or newer (tested on `v11.12.1`)
- **Web Browser**: Modern evergreen browser (Chrome, Firefox, Safari, Edge)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Spectakles/spectackle-product.git
   cd spectackle-product
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Usage

### Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Once running, visit [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

Compile and bundle production-optimized assets:

```bash
npm run build
```

The output files are generated in the `dist/` directory.

### Preview Production Build

Serve the built application locally to verify the production artifact:

```bash
npm run preview
```

---

## Configuration

| Configuration | File | Details |
| :--- | :--- | :--- |
| **Path Alias** | `vite.config.ts` | Uses `@/` to alias the `./src` directory |
| **CSS & Styles** | `tailwind.config.js`, `postcss.config.js` | Tailwind CSS utility classes and PostCSS autoprefixing |
| **TypeScript** | `tsconfig.json`, `tsconfig.app.json` | Strict type checking targeting ES2020 and DOM |
| **Linting** | `eslint.config.js` | ESLint 9 flat configuration with React hooks & refresh rules |

*(Note: No mandatory environment variables (`.env`) are currently required to run the client-side application)*

---

## Project Structure

```
spectackle-product/
├── public/                 # Static assets (logos, favicon)
├── src/
│   ├── components/         # Shared UI components (Layout, DemoModal)
│   ├── pages/              # Routed pages (Home, About, Impact, Pricing, FAQ)
│   ├── App.tsx             # Route declarations and root layout
│   ├── index.css           # Design tokens, custom styles, and Tailwind directives
│   ├── main.tsx            # DOM entry point and React root mounting
│   └── vite-env.d.ts       # TypeScript type declarations for Vite client
├── eslint.config.js        # ESLint flat config
├── index.html              # HTML shell entry point
├── package.json            # Project dependencies, scripts, and metadata
├── postcss.config.js       # PostCSS plugins configuration
├── tailwind.config.js      # Tailwind CSS theme configuration
├── tsconfig.app.json       # App-specific TypeScript compiler configuration
├── tsconfig.json           # Root TypeScript project references
└── vite.config.ts          # Vite build and plugin configuration
```

---

## Quality & Verification

Run the following checks to validate code quality and typing:

```bash
# Run TypeScript type checks
npm run typecheck

# Run ESLint validation
npm run lint
```

*(Note: A dedicated unit test runner such as Vitest is not currently configured in `package.json`)*

---

## Deployment

The project compiles to a standalone Single Page Application (SPA). To deploy:

1. Run `npm run build` to generate the production build in `dist/`.
2. Host the `dist/` folder on any static web host or CDN, such as:
   - **Vercel**
   - **Netlify**
   - **Cloudflare Pages**
   - **AWS S3 / CloudFront**
3. Ensure SPA rewrite rules are enabled so all subpaths (e.g. `/impact`, `/pricing`, `/faq`) route back to `index.html`.

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
