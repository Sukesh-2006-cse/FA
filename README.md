# Job Application Portal

A full-stack job application portal with React frontend and Node.js/Express backend.

## Project Structure

```
├── frontend/          # React application
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Node.js server
│   ├── server.js
│   └── package.json
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```
   The server will run on http://localhost:3001

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

## Features

- **Frontend**: React form with file upload and SHA-256 hashing
- **Backend**: Express server storing ledger entries in MongoDB Atlas
- **Ledger**: Stores application_id, resume_hash, and timestamp

## Workflow

When a user submits a resume:

1. The uploaded file is read
2. A SHA-256 hash of the resume is generated
3. A unique application_id is created
4. The resume_hash, application_id, and timestamp are stored in the public ledger (MongoDB Atlas)
5. All values are logged for debugging

## API Endpoints

- `POST /ledger` - Add a new application entry
- `GET /ledger` - Retrieve all application entries

## Technologies Used

### Frontend
- React 18
- Vite
- CSS3

### Backend
- Node.js
- Express
- MongoDB
- CORS