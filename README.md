# NightPulse - Nightlife Social Discovery & Club Bookings Platform

A modern, responsive web platform for nightlife social discovery and club bookings. Connect with clubbing companions, discover clubs, and book reservations all in one place.

## Features

### User Roles

1. **Regular Users**
   - Sign up as looking to date/club with men or women
   - Browse verified profiles of people interested in clubbing together
   - Filter by Kenya county, club, date, vibe
   - Chat or send club invites (no explicit content)
   - Book club reservations directly through the platform

2. **Female Users (Age Restricted)**
   - Mandatory age verification (20+ years old)
   - DOB validation during signup
   - ID upload placeholder for verification

3. **Clubs**
   - Create verified club profiles
   - List club details (location, music type, dress code)
   - Manage events & nights
   - Accept or reject reservations
   - Manage availability calendar

4. **Promoters**
   - Advertise clubs and events
   - Boost events to featured sections
   - View engagement analytics

5. **DJs**
   - Create DJ profiles
   - Upload music samples / links
   - Apply for club gigs
   - Clubs can book DJs directly

6. **Admin**
   - Approve clubs, promoters, DJs
   - Moderate profiles and content
   - Manage age verification
   - View platform analytics

### Key Features

- ✅ Authentication (email + password)
- ✅ Role-based dashboards
- ✅ Advanced search & filters (Kenya's 47 counties)
- ✅ Booking & reservation system
- ✅ Messaging system (safe, moderated)
- ✅ Club advertising & featured listings
- ✅ Age verification for female users (20+)
- ✅ Admin dashboard
- ✅ Mobile-first UI with dark nightlife aesthetic

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT
- **UI Components**: Custom components with React Icons
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NightPulse
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
```

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates SQLite file)
npm run db:push
```

5. (Optional) Seed the database with test data:
```bash
npm run seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The project uses SQLite with Prisma ORM. The database file (`dev.db`) will be created automatically when you run `npm run db:push`.

### Prisma Commands

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and run migrations (production)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Kenya Counties

The platform uses Kenya's 47 counties for location filtering. All users and clubs must select a county during registration. The county list is available in `lib/kenya-counties.ts`.

## Seed Data (Optional)

The seed script creates test accounts for all user roles:

- **Admin**: admin@nightpulse.com / admin123
- **User**: john@example.com / user123
- **User (Female)**: sarah@example.com / user123
- **Club**: club@example.com / club123
- **DJ**: dj@example.com / dj123

To seed the database:
```bash
npm run seed
```

## Project Structure

```
NightPulse/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── bookings/     # Booking management
│   │   ├── clubs/        # Club endpoints
│   │   ├── messages/     # Messaging system
│   │   └── users/        # User search
│   ├── admin/            # Admin dashboard
│   ├── bookings/         # Bookings page
│   ├── clubs/            # Club pages
│   ├── dashboard/        # User dashboard
│   ├── discover/         # Discovery page
│   ├── login/            # Login page
│   ├── messages/         # Messages page
│   ├── register/         # Registration page
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── Layout.tsx
│   └── Navbar.tsx
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Authentication utilities
│   ├── kenya-counties.ts # Kenya counties list
│   └── utils/            # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/
│   └── seed.ts           # Database seed script
└── public/               # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings` - Get bookings (filtered by role)
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/[id]` - Update booking status

### Clubs
- `GET /api/clubs` - Search clubs (filter by county)
- `GET /api/clubs/[id]` - Get club details
- `POST /api/clubs` - Create club (club role only)

### Messages
- `GET /api/messages` - Get conversations or messages
- `POST /api/messages` - Send message

### Users
- `GET /api/users/search` - Search users with filters (county, gender, lookingFor)
- `GET /api/users/[id]` - Get user profile

## Compliance & Safety

- ✅ Strict age enforcement (20+ for ladies)
- ✅ Content moderation system
- ✅ Report/block users functionality (placeholder)
- ✅ No explicit or sexual content allowed
- ✅ Privacy-first data handling
- ✅ Terms & community guidelines (to be added)

## UI/UX Features

- Dark theme with neon accents
- Smooth animations and transitions
- Responsive mobile-first design
- Clear call-to-actions
- Professional but fun vibe
- Kenya county-based filtering

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate

# Push schema changes (dev only)
npm run db:push
```

## Future Enhancements

- [ ] Social login (Google OAuth)
- [ ] File upload for profile images and ID verification
- [ ] Real-time messaging with WebSockets
- [ ] Advanced analytics for promoters
- [ ] DJ gig application system
- [ ] Event management for clubs
- [ ] Payment integration for bookings
- [ ] Email notifications
- [ ] Push notifications
- [ ] Mobile app (React Native)

## License

This project is private and proprietary.

## Support

For issues and questions, please contact the development team.

---

Built with ❤️ for the nightlife community in Kenya
