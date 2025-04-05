import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

class JoinGoogleMeet {
  constructor(emailId, password) {
    this.emailId = emailId;
    this.password = password;
  }

  async init() {
    // Configure Chrome to behave more like a real user
    const options = new chrome.Options();
    options.addArguments(
      '--disable-blink-features=AutomationControlled',
      '--start-maximized', 
      '--disable-notifications',
      '--use-fake-ui-for-media-stream',
      '--headless=new',  // new headless mode
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-fake-device-for-media-stream'
    );

    // Set realistic user agent
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Add some randomization to appear more human-like
    const randomDelay = () => Math.floor(Math.random() * (2000 - 500) + 500);

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Store random delay function for use in other methods
    this.randomDelay = randomDelay;
  }

  async login() {
    try {
      await this.driver.get('https://accounts.google.com/ServiceLogin');
      await new Promise(resolve => setTimeout(resolve, this.randomDelay())); // Random delay before typing

      // Type email with random delays between characters
      const emailField = await this.driver.wait(until.elementLocated(By.id('identifierId')), 15000);
      for (let char of this.emailId) {
        await emailField.sendKeys(char);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200)); // Random typing delay
      }

      await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
      await this.driver.findElement(By.id('identifierNext')).click();

      // Wait for password field to be visible and interactable
      await this.driver.wait(until.elementLocated(By.css('input[type="password"].whsOnd.zHQkBf')), 10000);
      const passwordField = await this.driver.wait(
        until.elementIsVisible(await this.driver.findElement(By.css('input[type="password"].whsOnd.zHQkBf'))),
        10000
      );

      await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
      
      // Type password with random delays
      for (let char of this.password) {
        await passwordField.sendKeys(char);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      }

      await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
      await this.driver.findElement(By.id('passwordNext')).click();

      await this.driver.wait(until.elementLocated(By.css('body')), 15000);
      console.log('Successfully logged into Google account');
    } catch (error) {
      console.error('Failed to login:', error.message);
      throw new Error('Login process failed - please check your credentials');
    }
  }

  async turnOffMicCam(meetLink) {
    try {
      console.log('Joining meeting...');
      await this.driver.get(meetLink);
      await new Promise(resolve => setTimeout(resolve, this.randomDelay()));

      try {
        // Click the sign in button
        const signInButton = await this.driver.wait(
          until.elementLocated(By.css('div.rrdnCc div[role="button"]')),
          15000
        );
        await signInButton.click();
        await new Promise(resolve => setTimeout(resolve, this.randomDelay()));

        // Click the account selector with specific email
        const accountSelector = await this.driver.wait(
          until.elementLocated(By.css('div[jsname="MBVUVe"][data-identifier="nisop299@gmail.com"]')),
          15000
        );
        await accountSelector.click();
        await new Promise(resolve => setTimeout(resolve, this.randomDelay()));

        // After sign in, wait for and disable mic/camera
        await this.driver.wait(until.elementLocated(By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]')), 30000);
        
        const buttons = await this.driver.findElements(By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]'));
        
        // Handle each button with natural delays
        for (const button of buttons) {
          const ariaLabel = await button.getAttribute('aria-label');
          if (!ariaLabel.toLowerCase().includes('turn on')) {
            await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
            await button.click();
          }
        }

        // Wait for and click "Ask to join" button with multiple selectors
        const joinButtonSelectors = [
          'div[jsname="Qx7uuf"]',
          'div[jsname="K4r5Yd"]',
          'div[data-mdc-dialog-action="join"]', 
          'div[aria-label*="Ask to join"]',
          'div[aria-label*="Join now"]'
        ];

        // Try each selector until we find the button
        let joinButton = null;
        for (const selector of joinButtonSelectors) {
          try {
            await this.driver.wait(until.elementLocated(By.css(selector)), 5000);
            joinButton = await this.driver.findElement(By.css(selector));
            break;
          } catch (err) {
            continue;
          }
        }

        if (!joinButton) {
          throw new Error('Could not find join button');
        }

        // Wait for button to be clickable
        await this.driver.wait(until.elementIsEnabled(joinButton), 10000);
        await joinButton.click();
        console.log('Ask to join button clicked successfully');

        // Check for and click any additional confirmation button that may appear
        try {
          const confirmButtonSelectors = [
            'button[jsname="j6LnYe"]',
            'button[data-id="confirm"]',
            'button[aria-label*="confirm"]'
          ];

          for (const selector of confirmButtonSelectors) {
            const confirmButton = await this.driver.wait(
              until.elementLocated(By.css(selector)),
              5000
            );
            if (confirmButton) {
              await confirmButton.click();
              console.log('Clicked additional confirmation button');
              break;
            }
          }
        } catch (err) {
          // No confirmation button found, continue normally
          console.log('No additional confirmation button found');
        }

        return true;

      } catch (error) {
        console.error('Could not find sign in button or join button:', error.message);
        console.log('Meeting has not been joined');
        throw new Error('Failed to prepare for meeting join');
      }

    } catch (error) {
      console.error('Error preparing for meeting:', error.message);
      throw new Error('Failed to set up meeting controls');
    }
  }

  async checkIfJoined() {
    try {
      // Look for multiple indicators of being in the meeting
      const indicators = [
        'div[data-meeting-title]',
        'div[aria-label*="participant"]', 
        'div[jscontroller*="meeting"]'
      ];
      
      await this.driver.wait(
        until.elementLocated(By.css(indicators.join(','))),
        45000 // Increased timeout for slow connections
      );
      
      console.log('Successfully joined the meeting');
      return true;
    } catch (error) {
      console.log('Not in meeting yet:', error.message);
      return false;
    }
  }
}

async function main() {
  const emailId = process.env.EMAIL_ID;
  const password = process.env.PASSWORD;
  const meetLink = process.env.MEET_LINK;

  const meet = new JoinGoogleMeet(emailId, password);
  
  try {
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
}

export { JoinGoogleMeet, main };
