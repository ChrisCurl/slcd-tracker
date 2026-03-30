# SLCD Daycare Reservation Tracker

A full-stack application for managing daycare reservations with a React frontend and Express backend, integrated with Google Sheets.

## Project Structure

```
slcd-tracker/
├── daycare-frontend/     # React frontend application
└── SLCD-backend/         # Express.js backend API
```

## Prerequisites

- Node.js 20+ ([Install](https://nodejs.org/))
- npm 10+
- Google Cloud Project with Sheets API enabled

## Setup Instructions

### 1. Backend Setup

```bash
cd SLCD-backend

# Copy environment template and add your credentials
cp .env.example .env

# Install dependencies
npm install

# For development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

**Environment Variables (.env):**
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `GOOGLE_SHEET_ID`: Your Google Sheets ID
- `GOOGLE_CREDENTIALS`: Service account JSON (see below)

### 2. Frontend Setup

```bash
cd daycare-frontend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

**Environment Variables (.env.local):**
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:3001)

### 3. Configure Google Sheets Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to Service Accounts
   - Create new service account
   - Create a JSON key
5. Share your Google Sheet with the service account email
6. Copy the JSON contents to `GOOGLE_CREDENTIALS` in your backend `.env`

## Running Locally

**Terminal 1 - Backend:**
```bash
cd SLCD-backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd daycare-frontend
npm start
```

Frontend will open at `http://localhost:3000`
Backend API runs at `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/reservations` - Get all reservations

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm test` - Run tests (configure testing framework)

### Frontend
- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not reversible)

## Technology Stack

**Frontend:**
- React 19
- React Scripts (Create React App)
- Testing Library

**Backend:**
- Express.js
- TypeScript
- Google Sheets API
- CORS
- Dotenv

## Security Notes

⚠️ **Never commit `.env` files to git** - they contain sensitive credentials
- Always use `.env.example` as a template
- Add `.env` to `.gitignore` (already configured)

## Deployment

(Add deployment instructions for your hosting platform here)

## Contributing

(Add contribution guidelines if applicable)

## License

ISC
