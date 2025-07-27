# Modular Multi-Tenant Shop System

A comprehensive full-stack web application that serves multiple business types (supermarket, saloon, tea stall, hotel, medical, etc.) within a single codebase and database. Each shop has a unique QR code that dynamically loads only the relevant logic, UI modules, and workflows specific to that shop type.

## 🚀 Features

### Core Features
- **QR Code Shop Detection**: Unique QR codes for each shop that dynamically load shop-specific content
- **Multi-Tenant Architecture**: Single codebase supporting multiple business types
- **Modular Design**: Dynamic module loading based on shop type and configuration
- **Real-time Updates**: WebSocket integration for live order/booking updates
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Progressive Web App**: Installable with offline capabilities

### Supported Business Types

#### 🏪 Supermarket
- Product catalog with categories
- Inventory management
- Barcode scanning
- Bulk pricing
- Delivery options
- Customer loyalty program

#### 💇 Beauty Salon
- Service booking system
- Staff scheduling
- Customer management
- Service packages
- Time slot management
- Appointment reminders

#### ☕ Tea Stall
- Quick order system
- Menu management
- Combo offers
- Loyalty points
- Fast checkout

#### 🏨 Hotel
- Room booking
- Guest management
- Additional services
- Check-in/check-out
- Room availability calendar

#### 🏥 Medical Center
- Appointment booking
- Patient records
- Prescription management
- Doctor scheduling
- Medical services

## 🏗️ Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend     │    │    Database     │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│    (MySQL)      │
│                 │    │    Express      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │   File Storage  │    │   WebSockets    │
│   (Caching)     │    │  (Cloudinary)   │    │ (Real-time)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Backend
- **Node.js + Express**: RESTful API server
- **MySQL**: Primary database with JSON fields for flexibility
- **Redis**: Caching and session management
- **Socket.io**: Real-time communication
- **JWT**: Authentication and authorization
- **Multer + Cloudinary**: File upload and storage

#### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Material-UI**: Component library
- **Framer Motion**: Animations
- **Zustand**: State management
- **React Query**: Server state management
- **Socket.io Client**: Real-time updates

## 📁 Project Structure

```
modular-shop-system/
├── backend/
│   ├── config/
│   │   ├── database.js          # MySQL configuration
│   │   └── redis.js             # Redis configuration
│   ├── models/
│   │   ├── Shop.js              # Shop model with QR logic
│   │   ├── Product.js           # Product/Service model
│   │   └── Order.js             # Order/Booking model
│   ├── routes/
│   │   ├── shop.js              # Shop routes (QR scanning)
│   │   ├── products.js          # Product management
│   │   └── orders.js            # Order management
│   ├── middleware/
│   │   ├── auth.js              # Authentication
│   │   └── validation.js        # Input validation
│   ├── database/
│   │   ├── schema.sql           # Database schema
│   │   └── migrations/          # Database migrations
│   └── index.js                 # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QRScanner.tsx    # QR code scanner
│   │   │   ├── modules/         # Business-specific modules
│   │   │   │   ├── supermarket/
│   │   │   │   ├── saloon/
│   │   │   │   ├── tea_stall/
│   │   │   │   ├── hotel/
│   │   │   │   ├── medical/
│   │   │   │   └── shared/
│   │   │   └── ui/              # Reusable UI components
│   │   ├── pages/
│   │   │   ├── scan/            # QR scanning page
│   │   │   ├── shop/[slug]/     # Dynamic shop pages
│   │   │   └── admin/           # Admin dashboard
│   │   ├── store/
│   │   │   └── shopStore.ts     # Zustand store
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   └── utils.ts         # Utility functions
│   │   └── styles/              # Global styles
│   ├── package.json
│   └── next.config.js
├── database/
│   └── schema.sql               # Complete database schema
├── .env.example                 # Environment variables template
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Redis 6.0+
- npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd modular-shop-system
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE modular_shop_system;
exit

# Run migrations
mysql -u root -p modular_shop_system < database/schema.sql
```

5. **Start Redis**
```bash
redis-server
```

6. **Start the backend server**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Start the frontend development server**
```bash
npm run dev
```

### Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=4000
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=modular_shop_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
STRIPE_SECRET_KEY=your_stripe_key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## 📱 QR Code Flow

### How QR Code Scanning Works

1. **QR Code Generation**: Each shop gets a unique QR code containing shop metadata
2. **Scanning Process**: Customer scans QR code using camera or uploads image
3. **Shop Detection**: Backend validates QR code and returns shop configuration
4. **Dynamic Loading**: Frontend dynamically loads appropriate modules for shop type
5. **Contextual UI**: User sees shop-specific interface with relevant features

### QR Code Structure
```json
{
  "type": "shop",
  "qr_code": "unique-shop-identifier",
  "shop_id": 123,
  "shop_name": "Example Shop"
}
```

## 🎨 UI/UX Features

### Animations and Interactions
- **Smooth page transitions** with Framer Motion
- **Loading skeletons** for better perceived performance
- **Gesture-based navigation** for mobile devices
- **Progressive disclosure** of information
- **Contextual feedback** for user actions

### Responsive Design
- **Mobile-first approach** with touch-optimized controls
- **Adaptive layouts** that work on all screen sizes
- **PWA capabilities** for app-like experience
- **Offline functionality** for core features

## 🔄 Adding New Shop Types

### Step 1: Database Configuration
Add new shop type to the database:
```sql
INSERT INTO shop_types (name, display_name, description, default_config) VALUES
('restaurant', 'Restaurant', 'Food and dining', JSON_OBJECT(
    'modules', JSON_ARRAY('menu', 'orders', 'tables', 'kitchen', 'customers'),
    'features', JSON_ARRAY('table_booking', 'online_ordering', 'kitchen_display'),
    'ui_theme', 'restaurant'
));
```

### Step 2: Backend Routes
Create shop-specific routes in `routes/restaurant.js`:
```javascript
const express = require('express');
const router = express.Router();

// Restaurant-specific endpoints
router.get('/menu', getMenu);
router.post('/orders', createOrder);
router.get('/tables', getTables);

module.exports = router;
```

### Step 3: Frontend Modules
Create module components in `frontend/src/components/modules/restaurant/`:
```typescript
// MenuModule.tsx
export const MenuModule = ({ shopId, config }) => {
  // Restaurant menu logic
  return <div>Restaurant Menu</div>;
};
```

### Step 4: Module Registration
Update `ModuleRenderer.tsx` to include new modules:
```typescript
const RestaurantModules = {
  MenuModule: lazy(() => import('./restaurant/MenuModule')),
  OrdersModule: lazy(() => import('./restaurant/OrdersModule')),
  // ... other modules
};
```

## 🔐 Security Features

- **JWT Authentication** with token refresh
- **Rate limiting** to prevent abuse
- **Input validation** with Joi schemas
- **SQL injection protection** with parameterized queries
- **XSS protection** with content sanitization
- **CORS configuration** for secure cross-origin requests

## 📊 Analytics and Monitoring

### Built-in Analytics
- **Page views** and user interactions
- **Order/booking patterns** and trends
- **Popular products/services** tracking
- **Customer behavior** analysis
- **Performance metrics** monitoring

### Dashboard Features
- **Real-time metrics** display
- **Custom date ranges** for reporting
- **Export functionality** for data analysis
- **Visual charts** with Recharts

## 🚢 Deployment

### Production Checklist
- [ ] Set secure JWT secrets
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure file storage (Cloudinary)
- [ ] Set up monitoring (PM2/Docker)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL certificates
- [ ] Configure backup strategy

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

## 🗺️ Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations
- [ ] Integration with more payment gateways
- [ ] Voice ordering capabilities
- [ ] Augmented reality features 
