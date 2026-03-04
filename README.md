# Online Food Ordering System with Real-time Kitchen Dashboard

# 🍕 Foodito - Online Food Ordering System

A full-stack food ordering system with real-time kitchen dashboard, admin panel, and secure payment processing. Built as a comprehensive portfolio project demonstrating modern web development practices.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🌟 Features

### Customer Features
- 🍔 Browse menu with categories and search
- 🛒 Shopping cart with persistent storage
- 🎨 Customizable menu items (size, toppings, spice level, etc.)
- 💳 Secure payment processing with Razorpay
- 📦 Order tracking with real-time status updates
- 👤 User authentication and profile management
- 📱 Fully responsive design

### Kitchen Dashboard Features
- 📊 Real-time order notifications (Socket.io)
- 🔄 Drag-and-drop order status management
- ⏱️ Estimated pickup time tracking
- 🔍 Order search and filtering
- 🔔 Audio notifications for new orders
- 📈 Live order statistics

### Admin Panel Features
- ➕ Complete menu CRUD operations
- 🖼️ Image upload for menu items
- 🏷️ Category management
- ⚡ Quick availability toggle
- 🔍 Advanced search and filtering
- 📋 Bulk operations (enable/disable/delete)
- 📋 Duplicate menu items
- 🎛️ Customization options management

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19.2 with Vite
- **Routing:** React Router v7
- **Styling:** Tailwind CSS
- **State Management:** Context API + useReducer
- **Real-time:** Socket.io Client
- **HTTP Client:** Axios
- **UI Components:** Lucide React Icons
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v5
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Payment Gateway:** Razorpay
- **Real-time:** Socket.io
- **File Upload:** Multer
- **Security:** express-rate-limit, CORS

---

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Razorpay Account** (for payment processing)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/foodhub.git
cd foodhub
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in the `backend` directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay Keys
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Frontend URLs
CUSTOMER_FRONTEND_URL=http://localhost:5173
KITCHEN_DASHBOARD_URL=http://localhost:5174
```

**Seed the database:**
```bash
npm run seed
```

### 3. Customer Frontend Setup
```bash
cd ../customer-frontend
npm install
```

Create `.env` file in the `customer-frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Kitchen Dashboard Setup
```bash
cd ../kitchen-dashboard
npm install
```

Create `.env` file in the `kitchen-dashboard` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## ▶️ Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```

**Runs on:** `http://localhost:5000`

### Start Customer Frontend
```bash
cd customer-frontend
npm run dev
```

**Runs on:** `http://localhost:5173`

### Start Kitchen Dashboard
```bash
cd kitchen-dashboard
npm run dev
```

**Runs on:** `http://localhost:5174`

---

## 👨‍💼 Creating Your First Admin User

After seeding the database and starting the backend:

### Option 1: MongoDB Compass
1. Open MongoDB Compass and connect to your database
2. Navigate to the `users` collection
3. Find your user account (by email)
4. Edit the document and add: `isAdmin: true`
5. Save changes

### Option 2: MongoDB Shell
```javascript
use your_database_name;

db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { isAdmin: true, role: "admin" } }
);
```

### Option 3: Manual Registration
1. Register a new account at `/register`
2. Use one of the above methods to set `isAdmin: true`
3. Login and access admin panel at `/admin/dashboard`

---

## 🔑 Test Credentials

### Razorpay Test Cards

**Success:**
- Card: `4100 2800 0000 1007`
- CVV: Any 3 digits
- Expiry: Any future date

**UPI:**
- `success@razorpay` (successful payment)
- `failure@razorpay` (failed payment)

---

## 📁 Project Structure
```
food-ordering-system/
├── backend/
│   ├── config/           # Database and upload configs
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth, admin, validation
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── scripts/          # Seed scripts
│   ├── uploads/          # Uploaded images
│   └── utils/            # Helper functions
│
├── customer-frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── assets/       # Static assets
│       ├── components/   # Reusable components
│       ├── context/      # React Context (Cart)
│       ├── pages/        # Page components
│       │   └── admin/    # Admin pages
│       └── services/     # API services
│
│   
│
└── kitchen-dashboard/
    ├── public/           # Static assets
    ├── src/
        ├── assets/       # Static assets
        ├── components/   # Dashboard components
        ├── pages/        # Dashboard pages
        ├── services/     # API services
        └── utils/        # Notifictions

    
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             User login
GET    /api/auth/me                Get current user
PUT    /api/auth/profile           Update profile
PUT    /api/auth/change-password   Change password
```

### Menu (Public)
```
GET    /api/menu                   Get all menu items
GET    /api/menu/:id               Get single item
GET    /api/menu/categories        Get all categories
```

### Menu (Admin Only)
```
POST   /api/menu                   Create menu item
PUT    /api/menu/:id               Update menu item
DELETE /api/menu/:id               Delete menu item
PATCH  /api/menu/:id/availability  Toggle availability
POST   /api/menu/bulk-delete       Bulk delete items
POST   /api/menu/bulk-toggle       Bulk toggle availability
```

### Orders
```
POST   /api/orders/create-razorpay-order   Create payment order
POST   /api/orders/verify-payment          Verify payment
GET    /api/orders/my-orders               Get user's orders
GET    /api/orders/:id                     Get single order
```

### Kitchen (Staff Only)
```
GET    /api/kitchen/orders                Get active orders
PUT    /api/kitchen/orders/:id/status     Update order status
```

### Admin
```
GET    /api/admin/verify              Verify admin access
```

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Protected Routes** - Client and server-side route protection
- **Rate Limiting** - Prevent brute force attacks
- **Input Validation** - Express-validator for data validation
- **CORS** - Configured for specific origins
- **Payment Verification** - Server-side signature verification
- **Price Validation** - Server-side total recalculation
- **Role-Based Access** - Admin, Kitchen Staff, Customer roles

---

## ⚡ Real-time Features

### Socket.io Events

**Server → Kitchen Dashboard:**
- `new_order` - New order placed
- `order_updated` - Order status changed

**Server → Customer:**
- Auto-polling every 30 seconds on Orders page

---

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Tablet optimized
- ✅ Desktop layouts
- ✅ Touch-friendly UI
- ✅ Hamburger menu for mobile

---

## 🎨 Features Highlights

### Customer Experience
- **Persistent Cart** - Cart saved to localStorage
- **Protected Checkout** - Must login to purchase
- **Real-time Updates** - Order status polling
- **Expandable Orders** - View order details inline
- **Smart Search** - Filter menu items
- **Price Display** - INR currency (₹)

### Admin Features
- **Image Upload** - Drag & drop image upload
- **Quick Actions** - Toggle availability with one click
- **Bulk Operations** - Manage multiple items at once
- **Duplicate Items** - Clone existing items
- **Category Management** - Simple string-based categories
- **Search & Filter** - Find items quickly

### Kitchen Dashboard
- **Color-coded Status** - Visual order states
- **Audio Alerts** - Sound on new orders
- **Connection Status** - Real-time indicator
- **Order Search** - Find orders by number/customer
- **Undo Actions** - Revert status changes

---

## 🚢 Deployment

### Backend (Render/Railway/Heroku)

1. Set environment variables in platform dashboard
2. Update `CUSTOMER_FRONTEND_URL` and `KITCHEN_DASHBOARD_URL`
3. Ensure MongoDB connection string is correct
4. Deploy from GitHub repository

### Frontend (Netlify/Vercel)

**Customer Frontend:**
1. Set `VITE_API_URL` to your backend URL
2. Set `VITE_RAZORPAY_KEY_ID`
3. Build command: `npm run build`
4. Publish directory: `dist`

**Kitchen Dashboard:**
1. Set `VITE_API_URL` to your backend URL
2. Build command: `npm run build`
3. Publish directory: `dist`

**Important:** Add `_redirects` file to `public` folder:


---

## 🐛 Known Issues / Limitations

- Email notifications not implemented (placeholder in .env)
- No order cancellation feature
- No customer reviews/ratings system
- Kitchen dashboard requires manual login
- No analytics dashboard (marked as "Coming soon")
- Admin panel mobile responsiveness needs improvement

---

## 🔮 Future Enhancements

- [ ] Email/SMS notifications
- [ ] Push notifications for customers
- [ ] Order cancellation & refunds
- [ ] Customer reviews and ratings
- [ ] Admin analytics dashboard
- [ ] Delivery tracking with maps
- [ ] Multiple restaurant support
- [ ] Websocket contoller are there but not properly implemented since app is in development mode!
- [ ] Coupon/discount system
- [ ] Order scheduling

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 💬 Support

For support, you can find my email on profile or open an issue in the GitHub repository.

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ and lots of ☕

</div>