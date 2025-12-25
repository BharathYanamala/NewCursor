# Quick Setup Guide

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

**Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` and set a strong JWT_SECRET:
```
JWT_SECRET="your-very-secure-secret-key-here"
```

**Initialize Database**:
```bash
npm run prisma:generate
npm run prisma:migrate
```

**Start Backend**:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend-web
npm install
npm start
```

### 3. Create First Admin User

After starting the backend, you have two options:

#### Option A: Via Database (Recommended for first setup)

1. Register a regular user through the web interface
2. Open the SQLite database:
   ```bash
   sqlite3 backend/dev.db
   ```
3. Update user role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
4. Exit: `.exit`

#### Option B: Via API (if you modify backend)

You can temporarily allow role selection during registration by modifying `backend/src/controllers/authController.js`.

### 4. Upload Questions

1. Login as admin
2. Go to Admin Dashboard
3. Upload `sample-questions.csv` (included in project root)

### 5. Test the Application

1. Register/Login as a participant
2. Start a quiz
3. Answer questions
4. View results

## Troubleshooting

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: React will prompt to use different port

### Database Errors
- Delete `backend/dev.db`
- Run `npm run prisma:migrate` again

### CORS Errors
- Ensure backend is running on port 5000
- Check `backend/src/server.js` CORS configuration

### File Upload Fails
- Ensure `backend/uploads/` directory exists
- Check file size (max 5MB)
- Verify file format (CSV or XLSX)

## Next Steps

- Customize complexity distribution in `backend/src/services/quizGenerator.js`
- Add more questions via CSV upload
- Customize UI colors in CSS files
- Deploy to production (update JWT_SECRET and database URL)

