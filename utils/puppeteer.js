import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

class JoinGoogleMeet {
  constructor(emailId, password) {
    this.emailId = emailId;
    this.password = password;
    console.log('JoinGoogleMeet instance created');
  }

  async init() {
    console.log('Initializing Chrome driver...');
    const options = new chrome.Options();
    options.addArguments(
      '--disable-blink-features=AutomationControlled',
      '--start-maximized', 
      '--headless=new',
      '--disable-notifications',
      '--use-fake-ui-for-media-stream',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-fake-device-for-media-stream',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-infobars',
      '--js-flags=--expose-gc',
      '--aggressive-cache-discard',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0'
    );

    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Building Chrome driver with options...');
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Simplified random delay function
    this.randomDelay = () => Math.floor(Math.random() * 1500 + 500);
    console.log('Chrome driver initialized successfully');
  }

  async login() {
    try {
      console.log('Starting login process...');
      await this.driver.get('https://accounts.google.com/ServiceLogin');
      await this._sleep(this.randomDelay());

      const emailField = await this.driver.wait(until.elementLocated(By.id('identifierId')), 10000);
      await this._typeSlowly(emailField, this.emailId);

      await this._sleep(this.randomDelay());
      await this.driver.findElement(By.id('identifierNext')).click();

      try {
        await this.driver.wait(until.elementLocated(By.css('input[type="password"]')), 15000);
        console.log('Password field located...');
        
        const passwordSelector = 'input[type="password"][name="Passwd"]';
        await this.driver.wait(until.elementLocated(By.css(passwordSelector)), 15000);
        const passwordField = await this.driver.wait(
          until.elementIsVisible(await this.driver.findElement(By.css(passwordSelector))),
          15000
        );
        await this._sleep(this.randomDelay());
        
        await this._typeSlowly(passwordField, this.password);

        await this._sleep(this.randomDelay());
        await this.driver.findElement(By.id('passwordNext')).click();
        await this.driver.wait(until.elementLocated(By.css('body')), 10000);
        console.log('Successfully logged into Google account');
      } catch (error) {
        console.error('Password field error:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Login failed:', error.message);
      throw new Error('Login process failed');
    }
  }

  async turnOffMicCam(meetLink) {
    try {
      console.log('Starting the meeting join process...');
      await this.driver.get(meetLink);
      await this._sleep(this.randomDelay());
  
      // Try to sign in if needed
      try {
        console.log('Looking for sign-in button...');
        const signInButton = await this.driver.wait(
          until.elementLocated(By.css('div.rrdnCc div[role="button"]')),
          5000
        );
        console.log('Found sign-in button, clicking it...');
        await signInButton.click();
        await this._sleep(this.randomDelay() + 300); // Add a bit more delay after clicking
        
        // Select account if needed
        try {
          console.log(`Looking for account: ${this.emailId}`);
          const accountSelector = await this.driver.wait(
            until.elementLocated(By.css(`div[data-identifier="${this.emailId}"]`)),
            5000
          );
          console.log('Found account, selecting it...');
          await accountSelector.click();
          await this._sleep(this.randomDelay() + 200);
        } catch (error) {
          console.log('No account selection needed, moving on...');
        }
      } catch (error) {
        console.log('Looks like we\'re already signed in, great!');
      }
  
      // Wait for meeting interface to load with a more human-like approach
      console.log('Waiting for the meeting controls to appear...');
      await this.driver.wait(
        until.elementLocated(By.css('div[role="button"][aria-label*="microphone"]')),
        15000
      );
      console.log('Meeting interface loaded!');
      
      // Add a small pause like a human would do to assess the interface
      await this._sleep(this.randomDelay() / 2);
  
      // Turn off microphone if it's on - with more human-like checking
      console.log('Checking microphone status...');
      const micButton = await this.driver.findElement(By.css('div[role="button"][aria-label*="microphone"]'));
      const micStatus = await micButton.getAttribute('aria-label');
      if (!micStatus.toLowerCase().includes('turn on')) {
        console.log('Turning off microphone...');
        await micButton.click();
        await this._sleep(700 + Math.random() * 300); // Variable delay after clicking
      } else {
        console.log('Microphone is already off, perfect!');
      }
      
      // Turn off camera if it's on - with more human-like checking
      console.log('Checking camera status...');
      const camButton = await this.driver.findElement(By.css('div[role="button"][aria-label*="camera"]'));
      const camStatus = await camButton.getAttribute('aria-label');
      if (!camStatus.toLowerCase().includes('turn on')) {
        console.log('Turning off camera...');
        await camButton.click();
        await this._sleep(600 + Math.random() * 400); // Variable delay after clicking
      } else {
        console.log('Camera is already off, great!');
      }
  
      // Take a moment before joining, like a human would
      await this._sleep(this.randomDelay());
      
      // Find and click join button - using the most reliable selector
      console.log('Looking for the join button...');
      const joinButton = await this.driver.wait(
        until.elementLocated(By.css('div[jsname="Qx7uuf"], div[jsname="K4r5Yd"], div[aria-label*="Join now"], div[aria-label*="Ask to join"]')),
        10000
      );
      await this.driver.wait(until.elementIsEnabled(joinButton), 5000);
      console.log('Found join button, clicking it now...');
      await joinButton.click();
      console.log('Join button clicked!');
  
      // Handle confirmation dialog if it appears - with more human-like behavior
      try {
        console.log('Checking for confirmation dialog...');
        const confirmButton = await this.driver.wait(
          until.elementLocated(By.css('button[jsname="j6LnYe"]')),
          2000
        );
        console.log('Confirmation dialog appeared, confirming...');
        await this._sleep(300 + Math.random() * 200); // Brief pause before confirming
        await confirmButton.click();
        console.log('Confirmed!');
      } catch (error) {
        console.log('No confirmation dialog appeared, continuing directly...');
      }
  
      console.log('Successfully joined the meeting! 🎉');
      return true;
    } catch (err) {
      console.error('Oops! Something went wrong while joining the meeting:', err.message);
      throw new Error('Meeting setup failed');
    }
  }
  
  // Helper methods
  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async _typeSlowly(element, text) {
    for (let char of text) {
      await element.sendKeys(char);
      await this._sleep(Math.random() * 100);
    }
  }

  async checkIfJoined() {
    try {
      const indicators = [
        'div[data-meeting-title]',
        'div[aria-label*="participant"]', 
        'div[jscontroller*="meeting"]'
      ];
      
      await this.driver.wait(
        until.elementLocated(By.css(indicators.join(','))),
        30000
      );
      
      return true;
    } catch (error) {
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

    // Check meeting status periodically
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 30000));
      if (!await meet.checkIfJoined()) {
        console.log('Meeting ended');
        break;
      }
    }
  } catch (error) {
    console.error('Automation failed:', error.message);
  } finally {
    // Ensure driver is closed to free resources
    if (meet.driver) {
      await meet.driver.quit();
    }
  }
}

export { JoinGoogleMeet, main };
