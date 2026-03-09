# SkillTok 🎓

> Short-form video learning platform where experts teach future skills through 30–120s vertical videos. TikTok UX, education focus.

![Platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android%20%7C%20Web-blue)
![License](https://img.shields.io/badge/license-Private-red)

## ✨ Features

- **📱 TikTok-style Feed** — Full-screen vertical video swipe with auto-play
- **🎓 Teacher & Student Roles** — Teachers upload content, students learn
- **❤️ Engagement** — Like, comment, save, share videos
- **👥 Social** — Follow teachers, view profiles, see follower lists
- **🔍 Explore & Search** — Browse 9 categories, search by title/tags
- **📊 Analytics** — Teachers see total views, likes, comments, saves
- **🌐 i18n** — English 🇬🇧, Polish 🇵🇱, Chinese 🇨🇳
- **🌙 Dark Mode** — Automatic dark/light theme support

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 55 (React Native) |
| Navigation | Expo Router |
| Auth | Firebase Auth |
| Database | MongoDB Atlas |
| Backend | Node.js + Express |
| Video Storage | Firebase Storage |
| State | Zustand |
| i18n | i18next + react-i18next |
| Video Player | expo-av |

## 📁 Project Structure

```
skilltok/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Auth screens
│   ├── (tabs)/             # Main tab navigation
│   └── _layout.tsx         # Root layout
├── components/             # Reusable components
├── constants/              # Theme, colors, config
├── i18n/                   # Translations (en, pl, zh)
├── services/               # API client, Firebase config
├── store/                  # Zustand stores
├── assets/                 # Images, fonts
└── server/                 # Backend API
    ├── models/             # Mongoose models
    ├── routes/             # Express routes
    ├── middleware/          # Auth middleware
    ├── scripts/            # Seed script
    └── config/             # DB config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier)
- Firebase project (free tier)

### 1. Clone & Install

```bash
git clone <repo-url>
cd skilltok

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Environment Variables

#### Frontend — `.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Backend — `server/.env`

```env
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/skilltok
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Storage**
5. Download web config → paste into `.env`
6. Generate service account key → paste into `server/.env`

### 4. MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP (or 0.0.0.0/0 for dev)
5. Copy connection string → paste into `server/.env`

### 5. Seed Demo Data

```bash
cd server
npm run seed
```

This creates 9 categories, 5 demo teachers, 3 demo students, 26 videos, 15 comments, and sample likes.

### 6. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm start
# Then press: w (web), i (iOS), a (Android)
```

### 7. Web Build

```bash
npx expo export:web
```

## 🌍 Deployment

### Backend → Render (free tier)

1. Push code to GitHub
2. Go to [Render](https://render.com)
3. Connect GitHub repo
4. Use the `render.yaml` blueprint or manually configure:
   - **Root directory**: `server`
   - **Build command**: `npm install`
   - **Start command**: `node index.js`
5. Set environment variables in Render dashboard

### Frontend → Expo EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for platforms
eas build --platform ios
eas build --platform android
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login & validate token |
| PUT | `/api/auth/profile` | Update profile |
| GET | `/api/videos/feed` | Paginated video feed |
| POST | `/api/videos` | Create video |
| POST | `/api/videos/:id/like` | Toggle like |
| POST | `/api/videos/:id/save` | Toggle save |
| GET | `/api/videos/:id/comments` | Get comments |
| POST | `/api/videos/:id/comments` | Add comment |
| POST | `/api/users/:id/follow` | Toggle follow |
| GET | `/api/categories` | List categories |
| GET | `/api/search` | Search videos |
| GET | `/api/health` | Health check |

## 🔒 Monetization (Prepared, Disabled)

The database schema includes `monetizationTier` on Users and `isPremium` + `premiumPrice` on Videos. All monetization API endpoints (`/api/monetization/*`) return `403 Feature Disabled`.

## 📄 License

Private — All rights reserved.
