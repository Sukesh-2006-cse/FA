import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3001;

// MongoDB connection string
const uri = "mongodb+srv://sukesh_2006:SY1xfNvGfiEbnRcU@cluster0.lg2htpb.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('FA'); // Use database name, assuming 'FA' or adjust as needed
    console.log('Connected to MongoDB Atlas successfully');
    console.log('Database name:', db.databaseName);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Full error:', error);
  }
}

connectDB();

// POST endpoint to add a ledger entry
app.post('/ledger', async (req, res) => {
  console.log('Received POST /ledger request:', req.body);
  try {
    const { application_id, resume_hash, timestamp } = req.body;
    console.log('Extracted data - application_id:', application_id, 'resume_hash:', resume_hash, 'timestamp:', timestamp);
    if (!db) {
      console.error('Database connection is null');
      throw new Error('Database not connected');
    }
    console.log('Database is connected, proceeding with insert');
    const collection = db.collection('public_ledger');
    console.log('Using collection: public_ledger');
    const result = await collection.insertOne({ application_id, resume_hash, timestamp });
    console.log('Inserted document with ID:', result.insertedId);
    res.status(201).json({ message: 'Entry added', id: result.insertedId });
  } catch (error) {
    console.error('Error in POST /ledger:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to retrieve all ledger entries
app.get('/ledger', async (req, res) => {
  try {
    const collection = db.collection('public_ledger');
    const entries = await collection.find({}).toArray();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to save tokens
app.post('/tokens', (req, res) => {
  const { tokens } = req.body;
  const filePath = path.join(path.dirname(__dirname), 'frontend', 'token.txt');
  console.log('Saving tokens to:', filePath);
  fs.writeFile(filePath, JSON.stringify(tokens, null, 2), (err) => {
    if (err) {
      console.error('Error writing token.txt:', err);
      res.status(500).json({ error: 'Failed to save tokens' });
    } else {
      console.log('Tokens saved successfully');
      res.json({ message: 'Tokens saved' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});