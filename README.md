# 📚 BookLend: Multilingual Library Management System

### *Empowering communities with a modern, inclusive reading experience.*

BookLend is a high-performance, glass-morphic web application designed to bridge the gap between diverse user bases in regions like Iraq and Kurdistan. By providing a seamless experience in **English, Arabic, and Kurdish**, BookLend ensures that library resources are accessible to everyone, regardless of their native language or script direction (LTR/RTL).

---

## ✨ Key Features

- 🌍 **Full Multilingual Interface**: Toggle between English, Arabic, and Kurdish instantly. The UI dynamically adjusts between Left-to-Right (LTR) and Right-to-Left (RTL) layouts.
- 🧪 **Glass-morphism UI/UX**: A modern, aesthetic design using transparent cards, blur effects, and smooth Framer Motion micro-interactions.
- 🛡️ **Role-Based Access Control (RBAC)**:
  - **Admin**: Manage books, review loan requests, track revenue, and promote/demote users.
  - **Member**: Browse the catalog, request rentals, and manage personal loan history.
- 📈 **Dynamic Admin Dashboard**: Real-time stats on monthly revenue, growth percentages, and low-stock alerts.
- 💰 **Automated Fee Calculation**: Intelligent system that calculates base fees upon rental and dynamically adds penalties for overdue returns.
- ⚡ **Real-time Auth & Session Recovery**: Advanced Supabase integration with custom lock handlers to prevent authentication deadlocks across multiple tabs.
- 🎨 **Shimmer Loading States**: Skeleton components ensure a perceived performance boost during data fetching.

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/) (v18)
- **Build Tool**: [Vite](https://vitejs.dev/) for lightning-fast development.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom glass-morphism configurations.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for staggered list reveals and interactive buttons.
- **Icons**: [Lucide React](https://lucide.dev/) for consistent, scalable iconography.
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + GoTrue Auth).
- **Deployment**: [Vercel](https://vercel.com/) with SPA routing configuration.

---

## 🏗️ Database Architecture

The system utilizes a robust PostgreSQL schema hosted on Supabase, secured with **Row Level Security (RLS)** to ensure users can only access data relevant to their role.

### Tables:
1.  **`profiles`**: Stores user metadata (full name, avatar, role, email). Linked to Supabase Auth `uid`.
2.  **`books`**: Contains the library catalog. Fields are localized to support multiple languages:
    - `title`, `title_ar`, `title_ku`
    - `description`, `description_ar`, `description_ku`
    - `author`, `genre`, `daily_rate`, `total_copies`, `available_copies`.
3.  **`loans`**: Tracks the lifecycle of a book rental.
    - `status`: `pending`, `active`, `returned`, `overdue`, `rejected`.
    - `total_fee` & `penalty_fee`: Calculated based on duration and return dates.
4.  **`activity_logs`**: (Admin only) A ledger of system-wide actions for auditing purposes.

---

## 🌐 Localization Strategy

BookLend handles localization at two critical levels:

1.  **UI Level**: A `LanguageContext` manages static labels (e.g., "Login", "Borrow") using a translation dictionary mapping keys to English, Arabic, and Kurdish.
2.  **Database Level**: Dynamic content (book titles and descriptions) is stored in language-specific columns. The `localize()` helper function intelligently picks the column based on the active user session (e.g., if the user is in Arabic mode, it prioritizes `title_ar` before falling back to `title`).

---

## 🚀 Installation Guide

### 1. Clone the repository
```bash
git clone https://github.com/your-username/booklend.git
cd booklend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📦 Deployment

This project is production-ready and optimized for **Vercel**. It includes a `vercel.json` file to handle Client-Side Routing (Single Page Application fallback), ensuring that refreshing the page on routes like `/admin` or `/dashboard` works correctly.

To deploy via Vercel CLI:
```bash
vercel
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for readers everywhere.*