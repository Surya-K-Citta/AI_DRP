# MSME AI DPR Generation Tool

A comprehensive, bilingual (English + Telugu), AI-powered platform for automating the creation of bankable Detailed Project Reports (DPRs) for Micro, Small & Medium Enterprises (MSMEs).

## 🎯 Mission

Empower first-time and rural entrepreneurs to easily generate complete, compliant DPRs aligned with government schemes (PMEGP, MUDRA, CGTMSE, Stand-Up India, MSME-CDP) — without relying on costly consultants.

## ✨ Key Features

### For Entrepreneurs
- 📝 **Guided Data Capture** - Multi-step wizard with smart forms and AI assistance
- 🤖 **AI-Powered Generation** - GPT-4o generates professional, bank-ready DPRs
- 🌐 **Bilingual Support** - Complete English ↔ Telugu translation
- 💰 **Scheme Matching** - ML-based recommendations for government schemes
- 🎤 **Voice Input** - Whisper API for multilingual voice transcription
- 📄 **Document Export** - Download DPRs as PDF or DOCX
- 💬 **AI Chat Assistant** - 24/7 guidance for DPR creation
- 📊 **Financial Projections** - Automated P&L, cash flow, and DSCR calculations

### For Admins
- 📈 **Analytics Dashboard** - Real-time metrics and insights
- 👥 **User Management** - Track entrepreneurs and projects
- 📊 **Usage Reports** - Monitor DPR generation and success rates
- 📍 **Geographic Insights** - Sector and location-wise breakdown
- ⭐ **Feedback Analysis** - User satisfaction tracking

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
client/
├── src/
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   ├── store/         # Zustand state management
│   ├── lib/           # API client & utilities
│   └── i18n/          # Translations (en/te)
└── public/
```

### Backend (Node.js + TypeScript)
```
server/
├── src/
│   ├── controllers/   # Request handlers
│   ├── models/        # MongoDB schemas
│   ├── services/      # Business logic
│   ├── middleware/    # Auth, validation, errors
│   ├── routes/        # API endpoints
│   └── config/        # Database & config
└── uploads/
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DRP
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 🔧 Configuration

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/msme-dpr

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google Translate (Optional)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (protected)

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### DPR Generation
- `POST /api/dpr/generate/:projectId` - Generate DPR
- `GET /api/dpr/:dprId` - Get DPR
- `GET /api/dpr/:dprId/download/pdf` - Download PDF
- `GET /api/dpr/:dprId/download/docx` - Download DOCX

### Government Schemes
- `GET /api/schemes` - List all schemes
- `POST /api/schemes/recommend/:projectId` - Get recommendations

### AI Assistant
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/transcribe` - Transcribe audio (Whisper)

### Admin
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/users` - List users
- `GET /api/admin/projects` - List all projects

## 🗄️ Database Schema

### User
```typescript
{
  name: string
  email: string
  passwordHash: string
  role: 'entrepreneur' | 'admin' | 'officer'
  udyamNumber?: string
  location?: string
  phoneNumber?: string
}
```

### Project
```typescript
{
  userId: ObjectId
  projectName: string
  projectType: 'individual' | 'cluster'
  industrySector: string
  totalCost: number
  ownContribution: number
  loanAmount: number
  location: string
  inputs: {
    businessDescription?: string
    targetMarket?: string
    rawMaterials?: Array<...>
    machinery?: Array<...>
    manpower?: Array<...>
  }
  status: 'draft' | 'in-progress' | 'completed'
}
```

### DPRVersion
```typescript
{
  projectId: ObjectId
  versionNumber: number
  content: {
    english: { executiveSummary, businessProfile, ... }
    telugu: { executiveSummary, businessProfile, ... }
  }
  financials: {
    projectCost, meansOfFinance, profitLoss, cashFlow, ...
  }
  generatedAt: Date
}
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Helmet.js security headers
- CORS configuration
- Rate limiting
- Input validation with express-validator
- Role-based access control (RBAC)

## 🌐 Supported Government Schemes

1. **PMEGP** - Prime Minister Employment Generation Programme
2. **MUDRA** - Pradhan Mantri MUDRA Yojana
3. **CGTMSE** - Credit Guarantee Fund Trust
4. **Stand-Up India** - For SC/ST and Women Entrepreneurs
5. **MSME-CDP** - MSME Cluster Development Programme

## 🧪 Testing

### Backend
```bash
cd server
npm test
```

### Frontend
```bash
cd client
npm test
```

## 📦 Production Deployment

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
# Deploy dist/ folder to hosting service
```

### Recommended Hosting
- **Backend**: AWS EC2, Render, Railway, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: MongoDB Atlas
- **Storage**: AWS S3, Cloudinary

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Built for empowering MSME entrepreneurs in India.

## 🙏 Acknowledgments

- OpenAI for GPT-4o and Whisper APIs
- Government of India MSME schemes
- All contributors and supporters

## 📧 Support

For support, email support@msmdrp.in or open an issue in the repository.

---

**Built with ❤️ for Indian Entrepreneurs**

