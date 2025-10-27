# MSME AI DPR Generation Tool - Backend

Backend API server for the MSME AI-powered Detailed Project Report generation platform.

## Features

- 🔐 JWT Authentication with role-based access control
- 📊 MongoDB database with Mongoose ODM
- 🤖 OpenAI GPT-4/GPT-4o integration for DPR generation
- 🎤 Whisper API for voice transcription
- 🌐 Bilingual support (English ↔ Telugu)
- 📄 PDF & DOCX document generation
- 💰 Scheme matching engine
- 📈 Financial projections and analytics
- 🔒 Security: Helmet, CORS, Rate limiting
- ✅ Input validation with express-validator

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **AI:** OpenAI API (GPT-4o, Whisper)
- **Authentication:** JWT + bcryptjs
- **Document Generation:** PDFKit, docx
- **Security:** Helmet, CORS, Rate Limiting

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/msme-dpr
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
PORT=5000
```

## Running the Server

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get user projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### DPR Generation
- `POST /api/dpr/generate/:projectId` - Generate DPR
- `GET /api/dpr/:dprId` - Get DPR details
- `GET /api/dpr/:dprId/status` - Check generation status
- `GET /api/dpr/project/:projectId` - Get all DPRs for project
- `GET /api/dpr/:dprId/download/pdf` - Download as PDF
- `GET /api/dpr/:dprId/download/docx` - Download as DOCX

### Schemes
- `GET /api/schemes` - Get all schemes
- `GET /api/schemes/:schemeCode` - Get scheme details
- `POST /api/schemes/recommend/:projectId` - Get scheme recommendations
- `POST /api/schemes/select/:projectId/:schemeCode` - Select scheme

### Feedback
- `POST /api/feedback/:projectId` - Submit feedback
- `GET /api/feedback/:projectId` - Get project feedback

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/transcribe` - Transcribe audio (Whisper)

### Admin (Admin role required)
- `GET /api/admin/analytics` - Get platform analytics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/projects` - Get all projects
- `GET /api/admin/feedback` - Get all feedback

## Database Models

- **User** - User authentication and profiles
- **Project** - Project details and inputs
- **Scheme** - Government schemes
- **SchemeMatch** - Scheme-project matching
- **DPRVersion** - Generated DPR versions
- **Feedback** - User feedback

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- Role-based access control (RBAC)

## Government Schemes Included

1. **PMEGP** - Prime Minister Employment Generation Programme
2. **MUDRA** - Pradhan Mantri MUDRA Yojana
3. **CGTMSE** - Credit Guarantee Fund Trust
4. **Stand-Up India** - For SC/ST and Women Entrepreneurs
5. **MSME-CDP** - MSME Cluster Development Programme

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API key (optional) | - |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## Development

- TypeScript for type safety
- Hot reload with ts-node-dev
- ESLint for code quality
- Structured logging with Morgan

## License

MIT

