# Clash of Clans Clan Manager

A comprehensive web application designed to help you manage your Clash of Clans clan, track statistics, and foster a strong community among your clan members.

## About The Project

This project is a full-stack web application built with modern technologies to provide a seamless and feature-rich experience for Clash of Clans players. It connects directly to the official Clash of Clans API to pull live data, while also providing a suite of tools for internal clan management and communication.

### Built With

*   [Next.js](https://nextjs.org/) - React Framework
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
*   [Supabase](https://supabase.io/) - PostgreSQL Database & Backend-as-a-Service
*   [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
*   [Shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS.
*   [Clash of Clans API](https://developer.clashofclans.com/) - Official API for game data.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm
*   A Supabase account for your database and authentication.
*   A Clash of Clans API key.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/clash-of-clans-clan-manager.git
    cd clash-of-clans-clan-manager
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env.local` in the root of your project and add the following environment variables. You can get these from your Supabase project settings.

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```

4.  **Set up the database:**
    You will need to set up your Supabase database with the required tables and functions. Here is the necessary SQL schema. You can run this in the Supabase SQL Editor.

    ```sql
    -- Waitlist Table
    CREATE TABLE public.waitlist (
        id bigint NOT NULL,
        email text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE public.waitlist OWNER TO postgres;
    CREATE SEQUENCE public.waitlist_id_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
    ALTER TABLE public.waitlist_id_seq OWNER TO postgres;
    ALTER SEQUENCE public.waitlist_id_seq OWNED BY public.waitlist.id;
    ALTER TABLE ONLY public.waitlist ALTER COLUMN id SET DEFAULT nextval('public.waitlist_id_seq'::regclass);
    ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);
    ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_email_key UNIQUE (email);

    -- Feature Requests Table
    CREATE TABLE public.feature_requests (
        id bigint NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        title text,
        description text,
        category character varying,
        user_id uuid DEFAULT auth.uid(),
        user_email text,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
    -- ... add policies as needed

    -- Feature Request Votes Table
    CREATE TABLE public.feature_request_votes (
        id bigint NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        request_id bigint,
        user_id uuid DEFAULT auth.uid()
    );
    -- ... add policies as needed

    -- Feature Request Comments Table
    CREATE TABLE public.feature_request_comments (
        id bigint NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        request_id bigint,
        user_id uuid DEFAULT auth.uid(),
        content text
    );
    -- ... add policies as needed

    -- Function to get feature requests with vote and comment counts
    CREATE OR REPLACE FUNCTION get_feature_requests_with_details(user_id_param uuid)
    RETURNS TABLE(id bigint, title text, description text, category text, created_at timestamp with time zone, vote_count bigint, comments_count bigint, user_voted boolean)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
          fr.id,
          fr.title,
          fr.description,
          fr.category,
          fr.created_at,
          (SELECT COUNT(*) FROM feature_request_votes frv WHERE frv.request_id = fr.id) AS vote_count,
          (SELECT COUNT(*) FROM feature_request_comments frc WHERE frc.request_id = fr.id) AS comments_count,
          EXISTS(SELECT 1 FROM feature_request_votes frv WHERE frv.request_id = fr.id AND frv.user_id = user_id_param) AS user_voted
      FROM
          feature_requests fr
      ORDER BY
          vote_count DESC, created_at DESC;
    END;
    $$;
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## Features

This application is packed with features to enhance your clan management experience.

### Core Features
*   **User Authentication**: Secure user registration and login functionality powered by Supabase Auth.
*   **Landing Page**: A welcoming landing page for new visitors with a waitlist signup form.
*   **Dashboard**: A central hub for authenticated users to access all clan-related tools and information.

### Clan Management & Analytics
*   **Live Clan Feed**: A real-time stream of important clan events and activities.
*   **Member Roster**: View a full list of clan members, their roles, and current status.
*   **Individual Player Stats**: Dive deep into individual player profiles to see their statistics, army compositions, and more.
*   **War Room**: Get up-to-date information on the current Clan War, including participants and attack status.
*   **Clan Analytics**: A dedicated page to visualize clan statistics and performance over time.
*   **Admin Tools**: Special tools for clan leaders and co-leaders to manage clan invitations.

### Community & Engagement
*   **Feedback & Feature Request System**:
    *   **Submit Ideas**: Users can submit their own ideas and suggestions for the clan or the app itself.
    *   **Public Board**: All ideas are displayed on a public feedback board where users can vote and comment.
    *   **Voting System**: Upvote the best ideas to help prioritize what gets worked on next.
    *   **Commenting**: Engage in discussions on specific suggestions.
    *   **Category Filtering**: Filter ideas by category (e.g., 'QoL', 'New Feature', 'UI/UX').
    *   **Personal Management**: Users can view, edit, and delete their own submitted ideas.
*   **Friend System**: Connect with other users on the platform by sending and accepting friend requests.

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

Your Name - [@your_twitter](https://twitter.com/your_twitter) - email@example.com

Project Link: [https://github.com/your-username/clash-of-clans-clan-manager](https://github.com/your-username/clash-of-clans-clan-manager)
