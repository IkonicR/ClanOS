# Clash of Clans Clan Manager SaaS

This is a Next.js-based SaaS application for managing a Clash of Clans clan. It uses Supabase for authentication and database services, and the official Clash of Clans API for fetching real-time game data.

## Current Functionality

*   **User Authentication:**
    *   Sign up using an email, password, and a valid Clash of Clans player tag and API token.
    *   Player ownership is verified against the Clash of Clans API.
    *   Secure login and sign-out functionality.
    *   Authentication is handled using Supabase Auth with the modern `@supabase/ssr` library for server-side rendering and middleware-based session management.

*   **World-Class Dashboard:**
    *   **Protected Route:** The `/dashboard` is only accessible to authenticated users.
    *   **Dynamic "Instant Pulse" Header:** A set of four auto-refreshing stat cards that provide a live, at-a-glance overview of the clan's key metrics:
        *   Clan name, badge, and level.
        *   Current war league and win streak.
        *   Total member count.
        *   Clan-wide donation ratio (donated vs. received troops).
    *   **Client-Side Auto-Refresh:** The "Instant Pulse" section automatically fetches fresh data every 60 seconds without needing a page reload, showing a loading state during updates.
    *   **Detailed Widgets:**
        *   **Player Info Card:** Displays the logged-in user's personal stats (level, trophies, war stars, etc.).
        *   **Clan Members Table:** A comprehensive list of all clan members, including their avatar, name, level, role, trophies, and donation counts.
        *   **Clan Details Card:** Shows the clan's description, total points, war wins, and location.

*   **Styling and UI:**
    *   **Dark Theme:** A modern, dark-themed UI built with Tailwind CSS.
    *   **Custom Components:** A set of manually created UI components (Button, Card, Table, Badge) that mimic the `shadcn/ui` style and API.
    *   **Iconography:** Uses `lucide-react` for clean and modern icons throughout the application.

## Tech Stack

*   **Framework:** Next.js 14 (with App Router)
*   **Authentication:** Supabase
*   **Styling:** Tailwind CSS
*   **UI Components:** Custom-built
*   **API:** Official Clash of Clans API (via a proxy)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
