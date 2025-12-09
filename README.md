# Campus Connect

A modern, premium campus event management mobile application built with React Native Expo. Campus Connect enables students and organizers to discover, create, and manage campus events with a beautiful glassmorphism UI design.

## 🎨 Design System

Campus Connect features a **BLACK + WHITE + GREY glassy theme** with:
- Modern, premium, and professional aesthetics
- Smooth animations and transitions
- Perfect alignment and consistent spacing
- Soft gradients and frosted glass effects
- Glassmorphism UI throughout

### Design Tokens

- **Colors**: Deep black backgrounds (#000000, #0A0A0A), glass overlays (rgba(255,255,255,0.05-0.12)), purple (#9B59B6), green (#2ECC71), and blue (#2980FF) accents
- **Typography**: Inter/Manrope/SF Pro Rounded style fonts with clear hierarchy
- **Spacing**: Consistent 20px horizontal padding, 14px vertical padding
- **Border Radius**: 20-24px for cards, full-pill for buttons
- **Effects**: 15-25px blur intensity, soft shadows with rgba(0,0,0,0.4)

## ✨ Features

### For Students
- 🏠 **Home Feed**: Browse upcoming and past events
- 🔍 **Explore**: Discover events by category and search
- 👥 **Clubs**: Browse and join campus clubs
- 📱 **QR Code Scanning**: Check-in to events via QR codes
- 💬 **Club Chat**: Engage in club discussions
- ⭐ **Event Feedback**: Rate and review attended events
- 📅 **My Events**: Track RSVP'd events

### For Organizers
- 📊 **Dashboard**: Manage events and view analytics
- ➕ **Create Events**: Create events with cover images (16:9 aspect ratio)
- 👥 **Create Clubs**: Start new clubs with images (1:1 aspect ratio)
- 📱 **QR Scanner**: Scan attendee QR codes for check-ins
- 💬 **Club Management**: Manage club details and chat
- 📅 **Event Management**: Reschedule, cancel, and manage events

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native with Expo (~54.0.25)
- **Routing**: Expo Router (file-based routing)
- **UI Libraries**: 
  - `expo-blur` for glassmorphism effects
  - `expo-linear-gradient` for gradients
  - `expo-image` for optimized image loading
  - `expo-image-picker` for image selection
- **State Management**: React Context API
- **Styling**: StyleSheet with custom theme system
- **Icons**: FontAwesome via `@expo/vector-icons`
- **Storage**: `@react-native-async-storage/async-storage`
- **Network**: Axios for API calls
- **Real-time**: Supabase for chat functionality

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, Google OAuth
- **File Upload**: Cloudinary integration with Multer

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Expo CLI (`npm install -g expo-cli`)
- Cloudinary account (for image uploads)

### Frontend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npx expo start
   ```

3. **Run on specific platform**
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios

   # Web
   npm run web
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (see Environment Variables section)

4. **Start the server**
   ```bash
   # Development (with nodemon)
   npm run dev

   # Production
   npm start
   ```

## 🔐 Environment Variables

### Backend `.env` File

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/campus-connect
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/campus-connect

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret



### Frontend Configuration

The frontend uses hardcoded API base URL in `services/api.ts`. Update it to match your backend URL:

```typescript
// services/api.ts
baseURL: 'http://localhost:5000/api' // Development
// baseURL: 'https://your-api-domain.com/api' // Production
```

## 📁 Project Structure

```
campus-connect/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (student)/         # Student user screens
│   ├── (organizer)/       # Organizer user screens
│   ├── event/             # Event detail screens
│   └── qr-code/           # QR code screens
├── components/            # Reusable UI components
│   ├── ui/                # Premium UI components
│   │   ├── PremiumHeader.tsx
│   │   ├── PremiumGlassCard.tsx
│   │   ├── GlassButton.tsx
│   │   ├── GlassInput.tsx
│   │   ├── PillTag.tsx
│   │   └── ...
│   └── event-card.tsx
├── constants/             # App constants
│   └── theme.ts           # Global design system
├── contexts/              # React Context providers
│   ├── auth.context.tsx
│   ├── events.context.tsx
│   └── network.context.tsx
├── services/              # API service layer
│   ├── api.ts
│   ├── event.service.ts
│   ├── club.service.ts
│   ├── chat.service.ts
│   └── upload.service.ts
├── utils/                 # Utility functions
│   ├── cloudinary.ts      # Cloudinary image utilities
│   ├── colorUtils.ts      # Color conversion utilities
│   ├── event.utils.ts     # Event helper functions
│   └── storage.ts         # AsyncStorage utilities
├── types/                 # TypeScript type definitions
├── backend/               # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── middleware/        # Custom middleware
│   └── server.js          # Entry point
└── assets/                # Static assets
```

## 🎨 Key Components

### UI Components

- **PremiumHeader**: Glass header with back button and title
- **PremiumGlassCard**: Glassmorphism card with blur and gradient
- **GlassButton**: Premium glass-styled buttons
- **GlassInput**: Glass-themed input fields
- **PillTag**: Status and category tags with glow effects
- **EventCard**: Reusable event card component
- **ChatBubble**: Message bubbles for chat screens

### Design System Usage

All components use the centralized theme from `constants/theme.ts`:

```typescript
import { Theme } from '../constants/theme';

// Colors
Theme.colors.background.primary
Theme.colors.text.primary
Theme.colors.accent.purple

// Spacing
Theme.spacing.lg
Theme.layout.padding.horizontal

// Typography
Theme.typography.fontSize['2xl']
Theme.typography.fontWeight.bold
```

## 📸 Cloudinary Integration

Campus Connect uses Cloudinary for image uploads and transformations:

- **Event Images**: 16:9 aspect ratio, auto-cropped
- **Club Images**: 1:1 aspect ratio, auto-cropped
- **Automatic Optimization**: Quality and format optimization
- **Organized Storage**: Images stored in `campus-connect/events` and `campus-connect/clubs` folders

### Image Upload Flow

1. User selects image via `expo-image-picker`
2. Image uploaded to backend `/api/upload/image` endpoint
3. Backend uploads to Cloudinary with folder organization
4. Frontend receives `publicId` and displays optimized image
5. Images are transformed on-the-fly using Cloudinary URL parameters

## 🚀 Development

### Running the App

1. **Start backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Expo development server** (in root directory)
   ```bash
   npx expo start
   ```

3. **Scan QR code** with Expo Go app or run on emulator/simulator

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Reusable UI components
- Centralized theme system

### Key Features Implementation

- **Authentication**: JWT-based auth with Google OAuth support
- **Real-time Chat**: Supabase real-time subscriptions
- **QR Code Generation**: `react-native-qrcode-svg` for event tickets
- **QR Code Scanning**: `expo-camera` for check-ins
- **Image Optimization**: Cloudinary transformations
- **Offline Support**: Network status detection with offline banner
- **Push Notifications**: Expo notifications (configured but optional)

## 📱 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (with some limitations)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- Campus Connect Development Team

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Cloudinary for image management
- All open-source contributors

---

**Note**: This is a campus event management system. Ensure proper authentication and authorization are configured before deploying to production.
