const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connect=require('./config/db')

dotenv.config();
connect();
const app=express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('api/menu', require('./routes/menuRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{ console.log(`Server is running on port ${PORT}` ); })
