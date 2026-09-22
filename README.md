# AgriNova Backend

Node.js + Express backend for the AgriNova Smart Agriculture & Farm-to-Market Platform, deployable to Vercel as a serverless function.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4+
- **Database:** MongoDB with Mongoose (Atlas recommended for production)
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express Validator
- **File Upload:** Multer (memory storage) + Cloudinary
- **Deployment:** Vercel serverless

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agrinova

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Frontend URL (comma-separated for multiple origins)
FRONTEND_URL=http://localhost:3000

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# External Services (optional)
WEATHER_API_KEY=your_weather_api_key
PAYMENT_GATEWAY_KEY=your_payment_gateway_key
AI_API_KEY=your_ai_api_key
CLOUD_STORAGE_BUCKET=your_cloud_storage_bucket
```

## Available Scripts

```bash
npm run dev      # Start development server with nodemon
npm run start    # Start production server
npm run seed     # Seed database with initial data (DELETES all users first)
npm run lint     # Run ESLint
```

## Project Structure

```
api/
└── index.js                 # Vercel serverless entry (exports Express app)

src/
├── config/
│   ├── db.js                # MongoDB connection (cached for serverless)
│   ├── cloudinary.js        # Cloudinary config
│   ├── roles.js             # Role / portal definitions
│   └── services.js          # External service keys
│
├── modules/
│   ├── auth/                # register / login / me
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.validation.js
│   └── users/               # profile / avatar
│       ├── users.controller.js
│       ├── users.service.js
│       └── users.routes.js
│
├── middleware/
│   ├── auth.middleware.js    # JWT authentication
│   ├── role.middleware.js    # Role-based access
│   ├── error.middleware.js   # Error handling
│   ├── upload.middleware.js  # Multer memory upload
│   └── validate.middleware.js
│
├── database/
│   ├── models/              # Mongoose models (User, Farm, Order, ...)
│   └── seed/
│       ├── autoSeed.js      # Seeds demo users when collection is empty
│       ├── demoUsers.js
│       └── index.js         # Manual full reseed (destructive)
│
├── utils/
│   └── AppError.js
│
├── app.js                   # Express app setup (+ serverless bootstrap)
└── server.js                # Local server entry point
```

## API Endpoints

### Health
```
GET    /api/health           # Health check (alias: GET /health)
```

### Authentication
```
POST   /api/auth/register    # Register new user (roles: farmer, buyer, supplier)
POST   /api/auth/login       # Login user
GET    /api/auth/me          # Get current user (Bearer token)
```

### Users
```
GET    /api/users/profile     # Get profile (Bearer token)
PUT    /api/users/profile     # Update profile (Bearer token)
POST   /api/users/avatar      # Upload avatar image, field: "avatar" (Bearer token)
```

> Other modules (farms, fields, crops, marketplace, orders, ...) are planned; routes exist as placeholders in `src/app.js` but are not mounted yet.

## Middleware

### Authentication
```javascript
const auth = require("./middleware/auth.middleware");

// Protected route
router.get("/protected", auth, controller.method);
```

### Role-Based Access
```javascript
const role = require("./middleware/role.middleware");

// Admin only route
router.get("/admin", auth, role(["admin"]), controller.method);

// Multiple roles
router.get("/farmer-or-buyer", auth, role(["farmer", "buyer"]), controller.method);
```

## Database Models

- **User** - User accounts and profiles
- **Farm** - Farm information
- **Field** - Field details
- **Crop** - Crop database
- **CropCycle** - Active crop cycles
- **Harvest** - Harvest lots
- **QualityRequest** - Quality verification
- **Product** - Marketplace products
- **Demand** - Buyer demands
- **Order** - Orders
- **Payment** - Payments
- **Delivery** - Deliveries
- **Expense** - Expense tracking
- **Notification** - Notifications

## Error Handling

All errors are handled by the error middleware and return:

```json
{
  "message": "Error message"
}
```

Status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

## Deploy to Vercel

The backend is a standalone repo (`api/index.js` exports the Express app; `vercel.json` rewrites `/api/*` and `/health` to it).

1. **Import the repo** into Vercel (Root Directory: repo root).

2. **Set environment variables** in *Project Settings → Environment Variables* (the local `.env` file is gitignored and never uploaded):

   | Variable | Required | Notes |
   |---|---|---|
   | `MONGODB_URI` | yes | MongoDB Atlas connection string |
   | `JWT_SECRET` | yes | Strong random secret |
   | `JWT_EXPIRE` | yes | e.g. `30d` |
   | `FRONTEND_URL` | yes | Deployed frontend origin(s), comma-separated (e.g. `https://app.vercel.app`) — used for CORS |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for avatar upload | Cloudinary credentials |

   `NODE_ENV` is set to `production` by Vercel automatically.

3. **MongoDB Atlas → Network Access:** allow `0.0.0.0/0` (or Vercel's IP ranges). Skipping this is the most common cause of cold-start 500s.

4. **Deploy**, then smoke test:
   ```
   GET  /health                    → 200 { "status": "ok", "db": "connected" }
   POST /api/auth/register         → 201
   POST /api/auth/login            → 200 { token, user }
   GET  /api/auth/me               → 200 (Authorization: Bearer <token>)
   GET  /api/users/profile         → 200 (Authorization: Bearer <token>)
   ```

5. **Seeding:** on first cold start the server runs `autoSeed`, which creates demo users (`farmer@demo.com`, etc., password `demo123`) **only when the users collection is empty**. It never overwrites existing users. For a full destructive reseed, run `npm run seed` locally against Atlas.

6. **Frontend:** set `NEXT_PUBLIC_API_URL=https://<backend>.vercel.app/api`.

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Vercel - Express.js](https://vercel.com/docs/frameworks/express)
