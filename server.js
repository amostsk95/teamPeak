import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/parse-transactions', (req, res) => {
  console.log('Calling Python script...');
  
  // Call the Python script
  const pythonScript = path.join(__dirname, 'parse-enhanced-transactions.py');
  const python = spawn('python3', [pythonScript]);
  
  let dataString = '';
  let errorString = '';
  
  python.stdout.on('data', (data) => {
    dataString += data.toString();
  });
  
  python.stderr.on('data', (data) => {
    errorString += data.toString();
  });
  
  python.on('close', (code) => {
    if (code === 0) {
      try {
        const jsonData = JSON.parse(dataString);
        console.log('Python script completed successfully');
        res.json(jsonData);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        res.status(500).json({ error: 'Failed to parse Python output' });
      }
    } else {
      console.error('Python script error:', errorString);
      res.status(500).json({ error: 'Python script failed', details: errorString });
    }
  });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Ready to call parse-enhanced-transactions.py');
});
