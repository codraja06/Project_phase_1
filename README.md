# AI-Powered Civic Issue Detection and Smart Complaint Management System

> **Final-Year Engineering Project — Phase 1**
> Detects civic issues (potholes, road damage, garbage) from photos using YOLO object detection, pins them on a GPS map, submits them to a city authority, and enables the authority to track and resolve complaints through a status pipeline.

---

## Architecture

```
[ React Native Expo Mobile App ]
     │
     ├── Citizen Interface: Camera → AI Detection → GPS → Submit Complaint
     └── Authority Interface: Dashboard → Review → Status Update (Pending → In Progress → Resolved)
           │
           │  REST API (JWT Authenticated, RBAC enforced)
           ▼
[ Node.js Express TypeScript Backend ]  ←→  [ MongoDB Database ]
     │                                  ←→  [ Cloudinary (image storage) ]
     └── AI Proxy (forwards image to Python service)
           │
           ▼  multipart/form-data
[ Python FastAPI + Ultralytics YOLOv8 AI Microservice ]
     └── models/best.pt → Returns { className, confidence, bbox: {x1,y1,x2,y2} }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native, Expo 51, TypeScript, React Navigation, Zod, React Hook Form, Expo Camera, Expo Location, react-native-maps, Axios |
| **Backend** | Node.js, Express, TypeScript, JWT, bcrypt, Helmet, CORS, Rate Limiting, Zod, Multer, Mongoose |
| **Database** | MongoDB (local or Atlas) |
| **Image Storage** | Cloudinary (with local fallback) |
| **AI Service** | Python, FastAPI, Ultralytics YOLOv8, OpenCV, Pillow |

---

## Project Structure

```
project1/
├── backend/           Node.js Express API (port 5000)
│   ├── src/
│   │   ├── config/   (env, db, cloudinary)
│   │   ├── controllers/
│   │   ├── middleware/ (auth, rbac, upload, errorHandler, rateLimiter)
│   │   ├── models/   (User.ts, Complaint.ts)
│   │   ├── routes/
│   │   ├── services/ (cloudinaryService, aiService)
│   │   ├── utils/    (jwt, apiError, apiResponse)
│   │   └── validators/
│   ├── .env          ← create from .env.example
│   └── .env.example
│
├── ai-service/        Python FastAPI (port 8000)
│   ├── app/          (main.py, detector.py, schemas.py, config.py)
│   ├── models/       ← place best.pt here
│   ├── training/     (train.py, dataset.yaml, README.md)
│   └── requirements.txt
│
└── mobile/            React Native Expo App
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── navigation/
    │   ├── screens/
    │   │   ├── auth/      (Splash, CitizenLogin, CitizenRegister, AuthorityLogin)
    │   │   ├── citizen/   (Dashboard, ReportIssue, History, Detail, Notifications, Profile)
    │   │   └── authority/ (Dashboard, Complaints, Detail, Profile)
    │   └── types/
    ├── .env          ← create from .env.example
    └── .env.example
```

---

## Environment Variables Setup

### 1. Backend — `backend/.env` (copy from `.env.example`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/civic_issue_db
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d

# Cloudinary (optional — app uses local file fallback if left empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# URL of the Python AI microservice
AI_SERVICE_URL=http://127.0.0.1:8000

# Google Maps API Key (optional — used only by backend for reference)
GOOGLE_MAPS_API_KEY=
```

### 2. AI Service — `ai-service/.env` (create if not present)

```env
AI_PORT=8000
MODEL_PATH=models/best.pt
CONF_THRESHOLD=0.25
```

### 3. Mobile App — `mobile/.env` (copy from `.env.example`)

```env
# IMPORTANT: Use your machine's LAN IP when testing on a physical device.
# Find your LAN IP:
#   Windows: ipconfig → IPv4 Address (e.g. 192.168.1.105)
#   Mac/Linux: ifconfig → inet (e.g. 192.168.1.105)
#
# Android emulator: use 10.0.2.2
# iOS simulator / Expo Web: use 127.0.0.1

EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api

# Get a free key from https://console.cloud.google.com/
# Enable: Maps SDK for Android, Maps SDK for iOS
# Also paste the same key into app.json → expo.android.config.googleMaps.apiKey
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## Running the Project

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally on port 27017 (or set `MONGODB_URI` to Atlas)
- Expo CLI: `npm install -g expo-cli` (optional — `npx expo` also works)

### Step 1 — Start MongoDB

Local:
```bash
mongod
```
Or use [MongoDB Community Server](https://www.mongodb.com/try/download/community) / [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### Step 2 — Start the Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit .env with your values
npm run dev                 # starts on http://localhost:5000
```

Verify: `http://localhost:5000/health` → `{ "status": "OK" }`

### Step 3 — Start the AI Microservice

```bash
cd ai-service

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

Verify: `http://localhost:8000/health`
- `"modelConfigured": false` → `best.pt` not placed yet (normal if not yet trained)
- `"modelConfigured": true` → model is ready for detection

### Step 4 — Start the Mobile App

```bash
cd mobile
npm install
cp .env.example .env        # then edit .env with your LAN IP
npx expo start
```

- Press `a` to open on Android emulator
- Scan QR code with **Expo Go** app on a physical device
- Press `w` to open in web browser

---

## AI Model Setup

The AI service requires a trained YOLO model at `ai-service/models/best.pt`.

**Without `best.pt`:** The app will show `"AI detection service is currently unavailable"` gracefully — all other features (submit, history, authority workflow) still work.

**To train your own model:**
```bash
cd ai-service/training
# Read README.md for dataset setup
python train.py --epochs 100 --batch 16
# best.pt is automatically copied to ../models/
```

See [`ai-service/training/README.md`](ai-service/training/README.md) for full training instructions with RDD2022.

---

## API Reference

### Auth Endpoints
```
POST   /api/auth/register          Register citizen
POST   /api/auth/login             Login (citizen or authority)
POST   /api/auth/logout            Logout (authenticated)
GET    /api/auth/me                Get current user
PUT    /api/auth/profile           Update name/phone
PUT    /api/auth/change-password   Change password
```

### Citizen Endpoints (requires citizen JWT)
```
POST   /api/complaints             Submit new complaint
GET    /api/complaints/my          Get own complaints (filter: status, category, search)
GET    /api/complaints/:id         Get specific complaint
```

### Authority Endpoints (requires authority JWT)
```
GET    /api/authority/complaints              All complaints (filter, search, sort)
GET    /api/authority/complaints/:id          Complaint detail
PATCH  /api/authority/complaints/:id/status   Update status (Pending→In Progress→Resolved)
DELETE /api/authority/complaints/:id          Delete invalid complaint
```

### AI + Upload
```
POST   /api/ai/detect       Detect civic issue in image (multipart)
POST   /api/uploads/image   Upload image to Cloudinary
```

---

## Creating an Authority Account

There is no public UI to register as an authority. Insert an authority user directly into MongoDB:

```javascript
// In MongoDB shell or Compass:
db.users.insertOne({
  name: "Municipal Officer",
  email: "officer@city.gov",
  phone: "9876543210",
  password: "$2a$10$...", // bcrypt hash — see below
  role: "authority",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

To generate a bcrypt hash for a password (e.g. `officer123`):
```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('officer123', 10).then(h => console.log(h));"
```

Then log in via the app's **Officer / Authority Login** button.

---

## Testing

```bash
# Backend unit + integration tests
cd backend && npm test

# AI service tests
cd ai-service && python -m pytest tests/ -v

# Mobile TypeScript type check
cd mobile && npm run type-check
```

---

## Status Workflow

```
Pending → In Progress → Resolved
```

- Status transitions are **strictly enforced** on the backend.
- Only an **authority** can update status.
- When resolved, a `resolvedAt` timestamp is stored.
- No reverse transitions (e.g. Resolved → Pending).

---

## Supported Civic Issue Categories

| Category | Description |
|----------|-------------|
| `pothole` | Road surface depressions |
| `road_damage` | Cracks, surface deterioration |
| `garbage` | Accumulated waste / illegal dumping |
| `drainage` | Blocked / broken drainage |
| `broken_streetlight` | Non-functional street lighting |

> Phase 1 AI detection focuses primarily on **pothole** and **road_damage** as these have the best available training datasets (RDD2022). Other categories are supported in the UI and API.

---

## Security Features

- JWT authentication on all protected routes
- RBAC (role-based access control) — citizens cannot access authority endpoints
- bcrypt password hashing (never stored in plaintext)
- Helmet security headers
- CORS configured
- Rate limiting on auth endpoints
- Zod validation on all API inputs
- Generic error messages (no stack traces in production)
- All secrets via environment variables — **never committed to git**
