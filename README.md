# AI-Enabled MSME DPR Generation Tool

A comprehensive AI-powered platform that guides entrepreneurs step-by-step to create professional, bank-ready Detailed Project Reports (DPRs) with extensive analytics and AP MSME ONE Portal integration.

## 🚀 Features

### Core DPR Generation
- **AI-Powered DPR Creation**: Step-by-step guidance for creating professional DPRs
- **Bilingual Support**: Generate DPRs in English, Telugu, or both languages
- **Bank-Ready Quality**: Optimized for bank approval with industry-standard formatting
- **Multiple Export Formats**: PDF and DOCX download options

### Enhanced AI Chatbot
- **Intelligent Guidance**: AI assistant provides step-by-step DPR creation guidance
- **Financial Suggestions**: Auto-suggests financial data, cost structures, and sector benchmarks
- **Government Scheme Recommendations**: Suggests relevant schemes from AP MSME ONE Portal
- **Voice Input Support**: Speech-to-text functionality for easy data entry
- **Context-Aware Responses**: Maintains conversation context for better assistance

### Machine Learning & Analytics
- **Quality Scoring**: Comprehensive DPR quality assessment (0-100%)
- **Bankability Analysis**: Evaluates loan approval likelihood
- **Completeness Tracking**: Monitors DPR section completion
- **User Satisfaction Metrics**: Tracks user feedback and satisfaction
- **Sector Benchmarking**: Compares against industry standards
- **Funding Outcome Tracking**: Monitors loan approval/rejection rates
- **ML-Powered Insights**: Continuous improvement based on feedback patterns

### Government Scheme Integration
- **AP MSME ONE Portal**: Seamless integration with Andhra Pradesh MSME portal
- **Scheme Recommendations**: AI-powered scheme matching based on project profile
- **Eligibility Checking**: Automatic eligibility verification
- **Application Tracking**: Monitor scheme application status
- **Financial Institution Directory**: Access to banks and lending institutions

### Comprehensive Analytics Dashboard
- **Real-time Metrics**: Live tracking of platform usage and performance
- **DPR Quality Trends**: Historical analysis of DPR quality improvements
- **Sector Performance**: Industry-wise success rates and benchmarks
- **Funding Outcomes**: Loan approval rates and funding statistics
- **User Engagement**: Platform usage patterns and user behavior
- **Policy Insights**: Data-driven insights for policymakers

### Data Privacy & Security
- **End-to-End Encryption**: Secure data transmission and storage
- **GDPR Compliance**: Adherence to data protection regulations
- **Role-Based Access**: Granular permission system
- **Audit Logging**: Comprehensive activity tracking
- **Data Anonymization**: Privacy-preserving analytics

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Recharts** for data visualization
- **React i18next** for internationalization
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose
- **OpenAI GPT-4** for AI capabilities
- **PDFKit** for PDF generation
- **Docx** for Word document generation
- **JWT** for authentication

### AI & ML
- **OpenAI GPT-4** for content generation
- **Whisper API** for speech-to-text
- **Custom ML algorithms** for quality scoring
- **Feedback analysis** for continuous improvement

## 📁 Project Structure

```
AI_DRP/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   ├── lib/           # Utilities and API client
│   │   └── i18n/          # Internationalization
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Custom middleware
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_DRP
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Server environment variables
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   mongod

   # Run database migrations (if any)
   npm run migrate
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend development server
   cd client
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/msme-dpr
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-api-key
AP_MSME_API_URL=https://apmsme.ap.gov.in/api
AP_MSME_API_KEY=your-ap-msme-api-key
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000/api
```

### RAG Setup (Optional)
To enable RAG functionality, ensure you have:
1. **OpenAI API Key** with access to Assistants API and File Search
2. **Sufficient API Credits** for vector store operations
3. **Upload Directory**: The server will create an `uploads/` directory automatically

#### Quick RAG Setup:
1. **Login as Admin** and navigate to `/admin/documents`
2. **Upload Documents**: Start by uploading DPR templates, government schemes, or policy documents
3. **Create Vector Stores**: Organize documents into logical knowledge bases
4. **Enable RAG in Chat**: Toggle "RAG On" in the chat interface to use document context
5. **Test Queries**: Ask questions and see AI responses based on uploaded content

#### Document Types for RAG:
- **DPR Templates**: Sample DPR formats and structures
- **Government Schemes**: Policy documents and eligibility criteria
- **Guidelines**: Step-by-step instructions and best practices
- **Industry Reports**: Market analysis and sector insights

### Environment Variables for RAG
```env
# Server (.env)
OPENAI_API_KEY=your-openai-api-key
AP_MSME_API_URL=https://apmsme.ap.gov.in/api
AP_MSME_API_KEY=your-ap-msme-api-key

# File upload configuration
MAX_FILE_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,md,rtf
```

**Note**: If `OPENAI_API_KEY` is not set in the environment, the system will use the default API key for development. For production, always set your own OpenAI API key.

## 🔑 OpenAI API Key Setup

The system requires an OpenAI API key for all AI functionality including:
- DPR generation
- AI chat assistance
- RAG (Retrieval-Augmented Generation)
- Vector store operations
- File search capabilities

### Development Setup:
1. **Use Default Key**: The system includes a fallback API key for development
2. **Environment Variable**: Set `OPENAI_API_KEY` in your `.env` file
3. **Production**: Always use your own OpenAI API key

### Required Permissions:
- **Assistants API**: For AI chat and DPR generation
- **File Search**: For RAG functionality
- **Vector Stores**: For document storage and retrieval

**Get your API key**: [OpenAI Platform](https://platform.openai.com/account/api-keys)

## 📚 RAG Implementation with Specific Vector Store

The system uses a dedicated vector store for all document processing and RAG operations:

### Main Vector Store Configuration
- **Vector Store ID**: ` `
- **Name**: MSME Knowledge Base
- **Purpose**: Primary knowledge base for DPR assistance and AI responses
- **Auto-Assignment**: All uploaded documents are automatically added to this vector store
- **Creation Disabled**: Vector store creation is disabled to maintain consistency with the dedicated store

### RAG Workflow
1. **Document Upload**: Admins upload documents through `/admin/documents`
2. **Automatic Processing**: Documents are processed and added to the main vector store
3. **AI Integration**: Chat interface uses RAG by default with this vector store
4. **Context-Aware Responses**: AI responses are based on uploaded document content

### Testing RAG Implementation
```bash
# 1. Upload a document as admin
curl -X POST http://localhost:5000/api/documents/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@sample-dpr.pdf" \
  -F "description=Sample DPR template" \
  -F "category=dpr-templates"

# 2. Chat with RAG enabled (automatically uses main vector store)
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I format my DPR?",
    "useRAG": true
  }'

# 3. Check vector store status
curl -X GET http://localhost:5000/api/documents/vector-stores/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Implementation Status
✅ **RAG System**: Fully implemented and configured  
✅ **Vector Store**: Using dedicated MSME Knowledge Base  
✅ **Document Processing**: Automatic upload and processing  
✅ **API Integration**: Complete OpenAI integration  
✅ **Admin Interface**: Document management UI ready  
✅ **Chat Integration**: RAG-enabled chat interface  

### Expected Behavior
- All uploaded documents are automatically added to ` `
- Chat interface uses RAG by default when documents are available
- AI responses are based on uploaded document content with source citations
- Vector store creation is disabled to maintain consistency

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### DPR Generation
- `POST /api/dpr/generate/:projectId` - Generate DPR
- `GET /api/dpr/:dprId` - Get DPR details
- `GET /api/dpr/:dprId/download/pdf` - Download PDF
- `GET /api/dpr/:dprId/download/docx` - Download DOCX

### AI Assistant
- `POST /api/ai/chat` - Chat with AI assistant (supports RAG)
- `POST /api/ai/transcribe` - Transcribe audio

### Document Management & RAG
- `POST /api/documents/upload` - Upload document for RAG processing
- `GET /api/documents` - List all documents with filtering
- `GET /api/documents/:documentId` - Get document details
- `DELETE /api/documents/:documentId` - Delete document
- `GET /api/documents/vector-stores/list` - List vector stores
- `POST /api/documents/vector-stores/create` - Create vector store
- `DELETE /api/documents/vector-stores/:vectorStoreId` - Delete vector store
- `POST /api/documents/search` - Search documents using RAG
- `POST /api/documents/rag/query` - Query with RAG using Responses API

### Analytics
- `GET /api/dpr/analytics/:projectId` - Get DPR analytics
- `GET /api/dpr/analytics/:projectId/report` - Download analytics report

### AP MSME Integration
- `GET /api/apmsme/schemes` - Get available schemes
- `GET /api/apmsme/guidelines/:sector` - Get sector guidelines
- `POST /api/apmsme/submit/:projectId/:dprId` - Submit DPR to AP MSME

## 🎯 Key Features Implementation

### 1. Enhanced AI Chatbot
- **Context-Aware Responses**: Maintains conversation history for better assistance
- **Financial Suggestions**: Provides specific cost estimates and funding recommendations
- **Scheme Recommendations**: Suggests relevant government schemes
- **Next Steps Guidance**: Provides actionable next steps for DPR creation

### 2. Machine Learning Quality Assessment
- **Multi-Dimensional Scoring**: Quality, bankability, completeness, and user satisfaction
- **Sector Benchmarking**: Compares against industry standards
- **Improvement Suggestions**: AI-powered recommendations for enhancement
- **Feedback Learning**: Continuous improvement based on user feedback

### 3. Comprehensive Analytics
- **Real-time Dashboards**: Live metrics and performance tracking
- **Trend Analysis**: Historical data visualization
- **Sector Performance**: Industry-wise success rates
- **Policy Insights**: Data-driven recommendations for policymakers

### 4. AP MSME ONE Portal Integration
- **Scheme Database**: Access to all AP MSME schemes
- **Eligibility Checking**: Automatic verification
- **Application Tracking**: Status monitoring
- **Financial Institution Directory**: Bank and lender information

## 🤖 Retrieval-Augmented Generation (RAG)

### Document Management System
- **Admin Document Upload**: Secure document upload interface for administrators
- **Multiple File Formats**: Support for PDF, DOC, DOCX, TXT, MD, RTF files (up to 50MB)
- **OpenAI Vector Store Integration**: Automatic integration with OpenAI's vector stores
- **File Search & Retrieval**: Real-time document search and retrieval capabilities

### RAG-Enhanced AI Chat
- **Context-Aware Responses**: AI responses based on uploaded document content
- **Source Citations**: Automatic citation of document sources in responses
- **Knowledge Base Selection**: Choose specific vector stores for targeted queries
- **Template-Based Guidance**: AI follows formats from uploaded template documents

### Vector Store Management
- **Create Vector Stores**: Organize documents into logical knowledge bases
- **Batch Processing**: Efficient processing of multiple documents
- **Status Monitoring**: Real-time tracking of document processing status
- **Admin Dashboard Integration**: Comprehensive RAG analytics and metrics

### API Endpoints
- `POST /api/documents/upload` - Upload document for RAG processing
- `GET /api/documents` - List all documents with filtering
- `POST /api/documents/search` - Search documents using RAG
- `POST /api/documents/rag/query` - Query with RAG using Responses API
- `GET /api/documents/vector-stores/list` - List vector stores
- `POST /api/ai/chat` - Enhanced chat with RAG support (useRAG parameter)

## 🌐 Internationalization

The platform supports both English and Telugu languages with comprehensive translations for:
- User interface elements
- DPR content generation
- Error messages and notifications
- Help text and guidance
- Analytics and reporting

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Role-Based Access Control**: Admin and user permissions
- **Data Encryption**: Sensitive data protection
- **Input Validation**: Comprehensive data validation
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Activity tracking and monitoring

## 📈 Performance Optimization

- **Lazy Loading**: Component-based code splitting
- **Caching**: Redis for session and data caching
- **Database Indexing**: Optimized queries
- **CDN Integration**: Static asset delivery
- **Compression**: Gzip compression for responses

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test

# Run e2e tests
npm run test:e2e
```

## 📦 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
```bash
# Build production assets
cd client
npm run build

# Start production server
cd ../server
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## 🔮 Future Enhancements

- **Mobile App**: Native mobile applications
- **Advanced ML**: Deep learning models for better predictions
- **Blockchain Integration**: Secure document verification
- **API Marketplace**: Third-party integrations
- **Advanced Analytics**: Predictive analytics and forecasting

---

**Built with ❤️ for MSME entrepreneurs in Andhra Pradesh**