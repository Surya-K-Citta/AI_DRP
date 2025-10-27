# MSME AI DPR Generation Tool - Frontend

React-based frontend application for the MSME AI-powered Detailed Project Report generation platform.

## Features

- 🔐 User authentication and profile management
- 📊 Interactive dashboard with project analytics
- 📝 Project creation and management
- 🤖 AI-powered chat assistant
- 🎤 Voice input with Whisper API integration
- 🌐 Bilingual support (English ↔ Telugu)
- 📄 DPR generation and download (PDF/DOCX)
- 💰 Government scheme recommendations
- 📈 Admin dashboard with charts and analytics
- 🎨 Modern UI with Tailwind CSS
- 📱 Fully responsive design

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **i18n:** react-i18next
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/         # Base UI components
│   │   ├── layout/     # Layout components
│   │   └── auth/       # Auth-related components
│   ├── pages/          # Page components
│   ├── store/          # Zustand stores
│   ├── lib/            # Utilities and API client
│   ├── i18n/           # Internationalization
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── vite.config.ts
└── tailwind.config.js
```

## Features Overview

### 1. Authentication
- User registration with validation
- JWT-based login
- Protected routes
- Role-based access control

### 2. Dashboard
- Project statistics
- Quick actions
- Recent projects
- Activity overview

### 3. Project Management
- Create and edit projects
- Multi-step form wizard
- Project listing with search/filter
- Status tracking (Draft, In Progress, Completed)

### 4. DPR Generation
- AI-powered content generation
- Bilingual support (English/Telugu)
- PDF and DOCX download
- Section-by-section preview
- Version management

### 5. AI Chat Assistant
- Real-time AI responses
- Voice input with Whisper API
- Conversation history
- Example questions
- Context-aware assistance

### 6. Government Schemes
- Scheme listing
- Eligibility checking
- Scheme recommendations
- Match scoring
- Detailed scheme information

### 7. Admin Dashboard
- User analytics
- Project statistics
- Sector-wise breakdown
- Location-wise distribution
- Recent activity monitoring
- Interactive charts

### 8. Internationalization
- English and Telugu support
- Dynamic language switching
- Translated UI elements
- Locale-specific formatting

## Components

### UI Components
- `Button` - Customizable button with variants
- `Input` - Form input with validation
- `Card` - Container component
- `Layout` - Page layout wrapper
- `Navbar` - Navigation bar

### Pages
- `Login` - User login
- `Register` - User registration
- `Dashboard` - Main dashboard
- `Projects` - Project listing
- `ProjectForm` - Create/edit project
- `DPRGeneration` - Generate and view DPR
- `Chat` - AI assistant chat
- `AdminDashboard` - Admin analytics

## State Management

### Auth Store
- User authentication state
- Login/logout actions
- User profile management

### Project Store
- Projects list
- Current project
- CRUD operations

### Chat Store
- Conversation messages
- Loading state
- Message management

## API Integration

All API calls are centralized in `src/lib/api.ts`:

- Authentication
- Project management
- DPR generation
- Scheme recommendations
- AI chat
- Admin analytics

## Voice Input

The application uses the Web Speech API for voice input:
- Browser-based recording
- Whisper API transcription
- Automatic text insertion
- Real-time feedback

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Custom theme configuration
- Dark mode support (CSS variables)
- Responsive design

### Design System
- Consistent color palette
- Typography scale
- Spacing system
- Component variants

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Preview the build:
```bash
npm run preview
```

3. Deploy the `dist/` folder to your hosting service

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:5000/api |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT

