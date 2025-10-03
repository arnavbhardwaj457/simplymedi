# SimplyMedi - AI-Powered Medical Report Simplifier

SimplyMedi is a comprehensive full-stack web application that helps patients understand their medical test reports using advanced AI technology. The system simplifies complex medical terms into patient-friendly language, provides multilingual support, and connects patients with healthcare professionals.

## 🌟 Features

### Core Functionality
- **AI-Powered Report Simplification**: Transform complex medical terminology into easy-to-understand language
- **OCR Support**: Extract text from PDF, image, and text files using Tesseract.js
- **Intelligent Chat Assistant**: AI-powered chatbot for health-related queries using Perplexity API
- **Doctor Appointment System**: Book and manage appointments with verified healthcare professionals
- **Multilingual Support**: Support for 12+ languages including Indian regional languages

### Technical Features
- **HIPAA Compliant**: Enterprise-grade security and data encryption
- **Accessibility First**: Screen reader support, high contrast mode, keyboard navigation
- **Real-time Processing**: Live updates for report processing and chat responses
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Scalable Architecture**: Built to handle 50k+ concurrent users

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: PostgreSQL with Sequelize ORM
- **AI Integration**: Hugging Face models for medical NLP
- **OCR Processing**: Tesseract.js for text extraction
- **File Upload**: Multer with encryption for sensitive data
- **API Design**: RESTful APIs with comprehensive error handling

### Frontend (React + TailwindCSS)
- **State Management**: React Query for server state, Context API for global state
- **Routing**: React Router with protected routes
- **UI Components**: Custom component library with accessibility features
- **Internationalization**: i18next for multilingual support
- **Real-time Updates**: Socket.io for live notifications

### Database Schema
- **Users**: Patient profiles with medical history
- **Doctors**: Healthcare professional profiles and availability
- **Reports**: Medical reports with processing status
- **SimplifiedReports**: AI-processed simplified versions
- **Appointments**: Booking and consultation management
- **ChatMessages**: AI chat history and context
- **Notifications**: System and user notifications
- **LanguagePreferences**: User language and accessibility settings

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/simplymedi.git
   cd simplymedi
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp server/env.example server/.env
   cp client/.env.example client/.env
   
   # Configure your environment variables
   nano server/.env
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb simplymedi
   
   # Run migrations (if available)
   cd server && npm run migrate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Or start individually
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

### Environment Variables

#### Server (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=simplymedi
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# AI Services
HUGGINGFACE_API_KEY=your_huggingface_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## 📱 Usage

### For Patients
1. **Register/Login**: Create an account or sign in
2. **Upload Reports**: Upload medical reports (PDF, images, text)
3. **View Simplified Reports**: Get AI-processed, easy-to-understand summaries
4. **Chat with AI**: Ask questions about your health and reports
5. **Book Appointments**: Schedule consultations with doctors
6. **Manage Profile**: Update medical history and preferences

### For Doctors
1. **Doctor Registration**: Complete verification process
2. **Manage Availability**: Set consultation hours and types
3. **View Appointments**: Manage patient appointments
4. **Patient Reports**: Access and review patient reports
5. **Consultation Notes**: Add notes and prescriptions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/register-doctor` - Doctor registration

### Reports
- `POST /api/reports/upload` - Upload medical report
- `GET /api/reports` - Get user reports
- `GET /api/reports/:id` - Get specific report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/reprocess` - Reprocess report

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/feedback/:id` - Provide feedback

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments` - Get user appointments
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id/cancel` - Cancel appointment

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor profile
- `GET /api/doctors/profile/me` - Get own profile (doctor)
- `PATCH /api/doctors/profile/me` - Update profile

## 🛡️ Security Features

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **HIPAA Compliance**: Healthcare data protection standards
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers and XSS protection

## 🌍 Multilingual Support

Supported Languages:
- **English** (Primary)
- **Indian Languages**: Hindi, Bengali, Tamil, Telugu, Kannada, Marathi, Gujarati, Punjabi
- **International**: Arabic, French, Mandarin

Features:
- Interface translation
- Report language preferences
- Chat language selection
- Auto-translation capabilities
- RTL language support

## ♿ Accessibility Features

- **Screen Reader Support**: ARIA labels and semantic HTML
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast Mode**: Enhanced visibility options
- **Large Font Support**: Adjustable text sizing
- **Voice Commands**: Voice control integration
- **Focus Management**: Proper focus indicators

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client && npm run build

# Start production server
cd server && npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t simplymedi .

# Run with Docker Compose
docker-compose up -d
```

### Environment-Specific Configurations
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Optimized build with security hardening

## 📊 Performance Optimization

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Redis caching for API responses
- **Database Indexing**: Optimized database queries
- **CDN Integration**: Static asset delivery
- **Compression**: Gzip compression for responses

## 🧪 Testing

```bash
# Run tests
npm test

# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# E2E tests
npm run test:e2e
```

## 📈 Monitoring & Analytics

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **User Analytics**: Usage patterns and insights
- **Health Checks**: System health monitoring
- **Logging**: Structured logging with Winston

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hugging Face**: For medical NLP models
- **Perplexity AI**: For intelligent chat capabilities
- **Tesseract.js**: For OCR functionality
- **React Community**: For excellent frontend tools
- **Node.js Community**: For robust backend solutions

## 📞 Support

- **Documentation**: [docs.simplymedi.com](https://docs.simplymedi.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/simplymedi/issues)
- **Email**: support@simplymedi.com
- **Discord**: [SimplyMedi Community](https://discord.gg/simplymedi)

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core report processing
- ✅ AI chat integration
- ✅ Basic appointment system
- ✅ Multilingual support

### Phase 2 (Q2 2024)
- 🔄 Advanced AI models
- 🔄 Telemedicine integration
- 🔄 Mobile app development
- 🔄 Advanced analytics

### Phase 3 (Q3 2024)
- 📋 AI-powered diagnosis assistance
- 📋 Integration with health devices
- 📋 Advanced reporting features
- 📋 Enterprise features

---

**SimplyMedi** - Making healthcare accessible and understandable for everyone through AI technology.
#   - s i m p l y m e d i  
 