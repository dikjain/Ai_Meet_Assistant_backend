import express from 'express';
import { JoinGoogleMeet } from './utils/puppeteer.js';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3000;

// Create screenshots directory if it doesn't exist
if (!fs.existsSync('screenshots')){
  fs.mkdirSync('screenshots');
}

app.use(express.json());
app.use('/screenshots', express.static('screenshots'));
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
  let meet = null;
  try {
    const { meetLink, emailId, password } = req.body;
    
    if (!meetLink || !emailId || !password) {
      return res.status(400).json({ error: 'Meeting link, email and password are required' });
    }

    meet = new JoinGoogleMeet(emailId, password);
    await meet.init();
    
    if (!(await meet.isLoggedIn())) {
      await meet.login();
    } else {
      console.log('Already logged in using stored session');
    }

    await meet.turnOffMicCam(meetLink);

    // Take screenshot on success
    try {
      const screenshot = await meet.driver.takeScreenshot();
      fs.writeFileSync('screenshots/screenshot.png', screenshot, 'base64');
      console.log('Screenshot saved successfully');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }

    // Send initial success response
    res.json({ message: 'Successfully joined meeting' });

    // Monitor meeting status in background
    (async () => {
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
        if (!await meet.checkIfJoined()) {
          console.log('Meeting ended or connection lost');
          // Take screenshot on error
          try {
            const screenshot = await meet.driver.takeScreenshot();
            fs.writeFileSync('screenshots/error.png', screenshot, 'base64');
            console.log('Error screenshot saved');
          } catch (screenshotError) {
            console.error('Failed to capture screenshot:', screenshotError.message);
          }
          break;
        }
      }
      if (meet) {
        await meet.cleanup();
      }
    })();

  } catch (error) {
    console.error('Meeting automation failed:', error.message);
    // Take screenshot on error
    try {
      if (meet && meet.driver) {
        const screenshot = await meet.driver.takeScreenshot();
        fs.writeFileSync('screenshots/error.png', screenshot, 'base64');
        console.log('Error screenshot saved');
        await meet.cleanup();
      }
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`Server running at http://localhost:${port}`);
});
