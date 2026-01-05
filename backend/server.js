import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection string
const uri =
  "mongodb+srv://sukesh_2006:SY1xfNvGfiEbnRcU@cluster0.lg2htpb.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('FA');
    console.log('Connected to MongoDB Atlas successfully');
    console.log('Database name:', db.databaseName);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
  }
}

connectDB();

/* ---------------- LEDGER ROUTES ---------------- */

// POST: Add ledger entry
app.post('/ledger', async (req, res) => {
  try {
    const { application_id, resume_hash, timestamp } = req.body;

    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const collection = db.collection('public_ledger');
    const result = await collection.insertOne({
      application_id,
      resume_hash,
      timestamp
    });

    res.status(201).json({
      message: 'Ledger entry added',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Error in POST /ledger:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch ledger entries
app.get('/ledger', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const collection = db.collection('public_ledger');
    const entries = await collection.find({}).toArray();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- TOKEN ROUTE ---------------- */

// POST: Save tokens to file
app.post('/tokens', (req, res) => {
  try {
    const { tokens } = req.body;

    const filePath = path.join(__dirname, 'token.txt');
    console.log('Saving tokens to:', filePath);

    fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2));

    res.json({ message: 'Tokens saved successfully' });
  } catch (error) {
    console.error('Error saving tokens:', error);
    res.status(500).json({ error: 'Failed to save tokens' });
  }
});

/* ---------------- START SERVER ---------------- */

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`);
});
