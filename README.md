# AgriNova Backend

Node.js + Express backend for the AgriNova Smart Agriculture & Farm-to-Market Platform.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4+
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Express Validator
- **File Upload:** Multer

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

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agrinova

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000

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
npm run seed     # Seed database with initial data
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── config/                 # Configuration
│   ├── db.js              # MongoDB connection
│   ├── env.js             # Environment variables
│   └── services.js        # External service configs
│
├── modules/                # Feature Modules
│   ├── auth/              # Authentication
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   └── auth.validation.js
│   │
│   ├── users/             # User management
│   ├── farms/             # Farm management
│   ├── fields/            # Field management
│   ├── crops/             # Crop management
│   ├── crop-cycles/       # Crop cycle tracking
│   ├── harvest/           # Harvest management
│   ├── quality/           # Quality verification
│   ├── marketplace/       # Marketplace
│   ├── demands/           # Demand board
│   ├── matching/          # Farmer-buyer matching
│   ├── orders/            # Orders
│   ├── payments/          # Payments
│   ├── deliveries/        # Deliveries
│   ├── expenses/          # Expense tracking
│   ├── notifications/     # Notifications
│   ├── weather/           # Weather integration
│   ├── recommendations/   # Crop recommendations
│   ├── ai-assistant/      # AI Assistant
│   └── admin/             # Admin operations
│
├── middleware/             # Middleware
│   ├── auth.middleware.js  # JWT authentication
│   ├── role.middleware.js  # Role-based access
│   ├── error.middleware.js # Error handling
│   └── upload.middleware.js # File uploads
│
├── database/               # Database
│   ├── models/            # Mongoose models
│   ├── indexes/           # Database indexes
│   └── seed/              # Seed data
│
├── integrations/          # External Services
│   ├── ai/                # AI API integration
│   ├── weather/           # Weather API
│   ├── payment/           # Payment gateway
│   ├── storage/           # Cloud storage
│   └── agricultural-data/ # Government datasets
│
├── utils/                 # Utilities
├── types/                 # Type definitions
├── constants/             # Constants
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

## API Endpoints

### Authentication
```
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # Login user
GET    /api/auth/me           # Get current user
```

### Farms
```
GET    /api/farms             # Get all farms
POST   /api/farms             # Create farm
GET    /api/farms/:id         # Get farm by ID
PUT    /api/farms/:id         # Update farm
DELETE /api/farms/:id         # Delete farm
```

### Fields
```
GET    /api/fields            # Get all fields
POST   /api/fields            # Create field
GET    /api/fields/:id        # Get field by ID
PUT    /api/fields/:id        # Update field
DELETE /api/fields/:id        # Delete field
```

### Crops
```
GET    /api/crops             # Get all crops
POST   /api/crops/recommend   # Get recommendations
GET    /api/crops/:id         # Get crop by ID
```

### Harvest
```
GET    /api/harvest           # Get all harvests
POST   /api/harvest           # Create harvest lot
GET    /api/harvest/:id       # Get harvest by ID
```

### Orders
```
GET    /api/orders            # Get all orders
POST   /api/orders            # Create order
GET    /api/orders/:id        # Get order by ID
PUT    /api/orders/:id/status # Update order status
```

### Marketplace
```
GET    /api/marketplace/inputs   # Get input products
GET    /api/marketplace/produce  # Get produce listings
POST   /api/marketplace/produce  # Create listing
```

### Demands
```
GET    /api/demands           # Get all demands
POST   /api/demands           # Create demand
GET    /api/demands/:id       # Get demand by ID
```

### Weather
```
GET    /api/weather           # Get weather data
```

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
- **Expense** - Expenses
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
- `500` - Server Error

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
