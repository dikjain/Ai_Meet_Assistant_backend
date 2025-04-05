import express from 'express';
import { JoinGoogleMeet } from './utils/puppeteer.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server and join meet
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);

  try {
    const meetLink = process.env.MEET_LINK;
    if (!meetLink) {
      console.error('MEET_LINK environment variable is required');
      return;
    }

    const meet = new JoinGoogleMeet(process.env.EMAIL_ID, process.env.PASSWORD);
    await meet.init();
    await meet.login();
    await meet.turnOffMicCam(meetLink);

    // Monitor meeting status
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
  } catch (error) {
    console.error('Meeting automation failed:', error.message);
  }
});
