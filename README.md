# 1.FC Köln ITP Player App

A modern, full-stack player management system for the 1.FC Köln International Talent Program, built with React, Vite, and Supabase.

![1.FC Köln Logo](https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/FC_Koln_Logo.svg/150px-FC_Koln_Logo.svg.png)

---

## Features

### Player Management
- ⚽ Complete player profiles with stats and status tracking
- 🏠 House assignment system with point-based competition
- 📊 Real-time leaderboards and rankings
- 🔍 Advanced filtering by position, status, and house

### Task Management
- ✅ Chore assignments with priority levels
- 📅 Deadline tracking and completion status
- ⭐ Points system for gamification
- 🏆 House competition scoring

### Calendar & Events
- 📅 Training sessions and team events
- 👥 Attendance tracking
- 🔔 Mandatory event flagging
- 📍 Location management

### Communication
- 💬 Internal messaging system
- 📧 Inbox and sent messages
- ✉️ Read/unread status tracking

### Admin Features
- 🔐 Role-based access control (Admin, Staff, Player)
- 📈 Dashboard analytics and insights
- 📝 Activity logging and audit trails
- 👥 User management

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **React Router 6** - Client-side routing
- **CSS3** - Glassmorphism design system

### Backend (Supabase)
- **PostgreSQL** - Relational database
- **Supabase Auth** - Authentication and authorization
- **Row Level Security** - Data security policies
- **Realtime** - Live updates and subscriptions
- **Storage** - File uploads (avatars, etc.)

### Performance
- ⚡ Code splitting and lazy loading
- 🚀 Optimized bundle size (~115 KB gzipped)
- 📱 Fully responsive mobile design
- 🎨 Premium dark mode UI

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/itp-player-app.git
cd itp-player-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

**Follow the complete setup guide:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Quick version:
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Open **SQL Editor**
3. Run `supabase/migrations/001_initial_schema.sql`
4. Run `supabase/migrations/002_seed_data.sql`

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
itp-player-app/
├── public/
│   └── fc-koln-logo.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ProtectedRoute.jsx
│   │   └── layout/
│   │       ├── MainLayout.jsx
│   │       ├── Sidebar.jsx
│   │       ├── Header.jsx
│   │       └── Layout.css
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   ├── supabase.js              # Supabase client
│   │   └── supabase-queries.js      # Data access layer
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Players.jsx
│   │   ├── Housing.jsx
│   │   ├── Chores.jsx
│   │   ├── Calendar.jsx
│   │   ├── Messages.jsx
│   │   └── Admin.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # Database schema
│   │   └── 002_seed_data.sql        # Sample data
│   └── config.toml                  # Supabase CLI config
├── .env.example                     # Environment template
├── package.json
├── vite.config.js
├── SUPABASE_SETUP.md               # Backend setup guide
└── PERFORMANCE_IMPROVEMENTS.md      # Performance analysis
```

---

## Database Schema

### Core Tables
- **profiles** - User accounts and roles
- **players** - Player profiles and stats
- **houses** - Housing units with points
- **chores** - Task assignments
- **events** - Calendar and activities
- **messages** - Internal messaging
- **activity_log** - Audit trail

### Key Features
- ✅ Row Level Security (RLS) on all tables
- ✅ Automatic timestamp tracking
- ✅ Foreign key constraints
- ✅ Indexed for performance
- ✅ Real-time subscriptions enabled

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete schema documentation.

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 5173)

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Supabase (requires CLI)
supabase start          # Start local Supabase
supabase stop           # Stop local Supabase
supabase db push        # Push migrations
supabase db reset       # Reset database
```

---

## Environment Variables

Create `.env.local` with:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Never commit `.env.local` to version control!**

---

## Authentication

### Demo Mode (No Supabase)
If Supabase credentials aren't configured, the app runs in demo mode with sample data.

Test credentials:
- **Email:** `max.bisinger@warubi-sports.com`
- **Password:** `ITP2024`

### Production Mode (With Supabase)
- Email/password authentication
- Email confirmation (optional)
- Password reset flow
- Role-based access control

---

## Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Deploy to Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

---

## Performance

### Optimization Features
- ⚡ Code splitting (7 lazy-loaded page chunks)
- 🎯 Debounced search (300ms delay)
- 📦 Memoized computations (useMemo, useCallback)
- 🔄 Optimistic UI updates
- 📱 Mobile-first responsive design

### Build Stats
- **Initial load:** ~379 KB (~108 KB gzipped)
- **Page chunks:** ~6.5 KB average (~1.77 KB gzipped)
- **Build time:** ~678ms
- **Performance grade:** A-

See [PERFORMANCE_IMPROVEMENTS.md](./PERFORMANCE_IMPROVEMENTS.md) for detailed analysis.

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security

### Reporting Vulnerabilities
Please report security issues to: security@warubi-sports.com

### Best Practices
- ✅ Row Level Security enabled
- ✅ Environment variables for secrets
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React auto-escaping)
- ✅ CSRF protection (Supabase Auth)

---

## License

This project is proprietary software owned by Warubi Sports GmbH.
Unauthorized copying or distribution is prohibited.

---

## Support

- **Documentation:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Email:** support@warubi-sports.com
- **Issues:** [GitHub Issues](https://github.com/your-org/itp-player-app/issues)

---

## Credits

**Developed by:** Warubi Sports GmbH  
**Powered by:** Supabase, React, Vite  
**For:** 1.FC Köln International Talent Program

---

Built with ❤️ for 1.FC Köln
