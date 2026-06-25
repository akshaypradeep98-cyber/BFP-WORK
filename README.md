# Next.js + Supabase + Tailwind CSS

A modern web application starter template with Next.js 15, Supabase, and Tailwind CSS.

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Add your Supabase credentials to `.env.local`:
   - Get your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings
   - Optionally add `SUPABASE_SERVICE_ROLE_KEY` for server-side operations

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles with Tailwind
├── components/          # Reusable React components
├── lib/                 # Utility functions
│   └── supabase.ts      # Supabase client initialization
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── next.config.js       # Next.js configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Technologies

- **Next.js** - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Open-source Firebase alternative with PostgreSQL

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
