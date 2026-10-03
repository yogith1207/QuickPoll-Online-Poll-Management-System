import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import pollRouter from './routes/polls.js';

dotenv.config();
const app=express();
app.use(cors()); app.use(express.json()); app.use(express.static('public'));
app.use('/api/polls', pollRouter);
app.get('/api/health',(req,res)=>res.json({ok:true}));
app.get('/{*splat}',(req,res)=>res.sendFile(process.cwd()+'/public/index.html'));
const port=process.env.PORT||3000;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/online_polls')
 .then(()=>app.listen(port,()=>console.log(`Poll app running on http://localhost:${port}`)))
 .catch(err=>{console.error('MongoDB connection failed:',err.message);process.exit(1)});
