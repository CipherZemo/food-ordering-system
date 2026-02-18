const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connect=require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();
connect();
const app=express();

app.use(cors());
app.use('/api/webhooks', require('./routes/webhookRoutes'));
// Webhook route MUST be before express.json() since Stripe needs raw body for signature verification
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/', apiLimiter);
app.use('api/menu', require('./routes/menuRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/kitchen', require('./routes/kitchenRoutes'));

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{ console.log(`Server is running on port ${PORT}` ); })
