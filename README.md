# Quiz Application - Web & Mobile

A production-ready quiz application with adaptive question selection, role-based access control, and dynamic quiz generation.

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐     ┌─────────────────┐
│  React Web App  │     │  React Native   │
│   (Browser)     │     │   (Mobile)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Express REST API   │
         │   (Node.js + JWT)    │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   SQLite Database    │
         │   (Prisma ORM)       │
         └──────────────────────┘
```

## 🚀 Features

### User Roles
- **Admin**: Upload questions via CSV/XLSX, manage quiz content
- **Participant**: Take quizzes, view results, track progress

### Quiz Features
- **Dynamic Question Selection**: 10 questions per quiz
- **Adaptive Logic**: Questions answered correctly never repeat
- **Complexity Levels**: Easy, Moderate, Complex
- **Question Types**: Multiple Choice (MCQ) and Fill in the Blanks
- **Instant Results**: Immediate feedback with color-coded answers

### Technical Features
- JWT Authentication
- Role-based access control
- Responsive design (mobile-first)
- CSV/XLSX bulk question upload
- Real-time quiz progress tracking

## 📁 Project Structure

```
quiz-application/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth & role checking
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── server.js       # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend-web/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # Auth context
│   │   ├── services/        # API service
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file (already created) with:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-change-this-in-production"
   PORT=5000
   ```

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Web Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file (optional)**
   Create `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   App will run on `http://localhost:3000`

## 📊 Database Schema

### Tables
- **users**: User accounts with roles
- **questions**: Quiz questions
- **options**: Multiple choice options
- **quiz_attempts**: Quiz session records
- **quiz_answers**: Individual answer records
- **user_question_history**: Tracks correct answers (adaptive logic)

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Quiz
- `POST /api/quiz/start` - Start new quiz (returns 10 questions)
- `POST /api/quiz/submit` - Submit quiz answers

### Admin
- `POST /api/admin/upload-questions` - Upload questions file (multipart/form-data)

## 📝 CSV Format for Questions

The CSV file should have the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Question Text | The question | "What is the capital of France?" |
| Question Type | "objective" or "fill_blank" | "objective" |
| Options | For objective: "A: Option1, B: Option2..." | "A: Paris, B: London, C: Berlin, D: Madrid" |
| Correct Answer | Correct answer | "A" (for objective) or "programming" (for fill_blank) |
| Complexity Level | "easy", "moderate", or "complex" | "Easy" |

**Sample CSV file is included**: `sample-questions.csv`

## 🎯 Quiz Generation Algorithm

The system uses an adaptive algorithm to select questions:

1. **Exclude Correct Answers**: Questions the user answered correctly before are excluded
2. **Complexity Distribution**: Default is 4 Easy, 4 Moderate, 2 Complex
3. **Random Selection**: Questions are randomly selected from available pool
4. **Fallback**: If not enough questions in a category, fills from available pool

## 🎨 Key Features Explained

### Adaptive Question Selection
- When a user answers correctly, that question is marked in `user_question_history`
- Future quizzes exclude questions with `is_correct = true` for that user
- This ensures users see new questions and don't repeat mastered content

### Result Highlighting
- **Green**: Correct answers
- **Red**: Incorrect user selections
- **Fill-in-the-blank**: Shows user answer vs correct answer side-by-side

### Security
- JWT tokens for authentication
- Password hashing with bcrypt
- Role-based route protection
- Input validation on all endpoints

## 🧪 Testing the Application

1. **Create Admin Account**
   - Register with role "admin" (modify backend to allow this, or create via database)
   - Or register normally and update database: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com'`

2. **Upload Questions**
   - Login as admin
   - Go to Admin Dashboard
   - Upload `sample-questions.csv`

3. **Take Quiz**
   - Register/Login as participant
   - Start a quiz
   - Answer questions
   - View results

## 🔧 Configuration

### Complexity Distribution
Edit `backend/src/services/quizGenerator.js`:
```javascript
const complexityDistribution = { easy: 4, moderate: 4, complex: 2 };
```

### Quiz Length
Edit `backend/src/services/quizGenerator.js` to change from 10 questions.

## 📱 Mobile Support

The frontend is built with mobile-first responsive design. For React Native implementation, the business logic can be shared between web and mobile.

## 🐛 Troubleshooting

### Database Issues
- Delete `backend/dev.db` and run migrations again
- Check Prisma schema is correct

### CORS Issues
- Ensure backend CORS is configured for frontend URL
- Check `backend/src/server.js` CORS settings

### File Upload Issues
- Ensure `uploads/` directory exists
- Check file size limits (5MB default)

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using React, Node.js, Express, Prisma, and SQLite**

"# NewCursor" 
