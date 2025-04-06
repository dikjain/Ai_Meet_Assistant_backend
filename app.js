import express from 'express';
import { JoinGoogleMeet } from './utils/puppeteer.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Define routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/join-meet', async (req, res) => {
  try {
    const { meetLink, emailId, password } = req.body;
    
    if (!meetLink || !emailId || !password) {
      return res.status(400).json({ error: 'Meeting link, email and password are required' });
    }

    const meet = new JoinGoogleMeet(emailId, password);
    await meet.init();
    await meet.login();
    await meet.turnOffMicCam(meetLink);

    // Send initial success response
    res.json({ message: 'Successfully joined meeting' });

    // Monitor meeting status in background
    (async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
        try {
          if (!await meet.checkIfJoined()) {
            console.log('Meeting appears to have ended');
            break;
          }
        } catch (error) {
          console.error('Lost connection to meeting:', error.message);
          break;
        }
      }
    })();

  } catch (error) {
    console.error('Meeting automation failed:', error.message);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
