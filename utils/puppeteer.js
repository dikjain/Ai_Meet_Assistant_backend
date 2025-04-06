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

    console.log('Building Chrome driver with options...');
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    // Store random delay function for use in other methods
    this.randomDelay = randomDelay;
    console.log('Chrome driver initialized successfully');
  }

  async login() {
    try {
      console.log('Starting login process...');
      console.log('Navigating to Google login page...');
      await this.driver.get('https://accounts.google.com/ServiceLogin');
      await new Promise(resolve => setTimeout(resolve, this.randomDelay())); 

      console.log('Looking for email field...');
      const emailField = await this.driver.wait(until.elementLocated(By.id('identifierId')), 15000);
      console.log('Email field found, entering email...');
      for (let char of this.emailId) {
        await emailField.sendKeys(char);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      }

      console.log('Email entered, clicking next...');
      await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
      await this.driver.findElement(By.id('identifierNext')).click();

      console.log('Waiting for password field...');
      // Increased timeout and added more detailed error handling
      try {
        await this.driver.wait(until.elementLocated(By.css('input[type="password"]')), 15000);
        console.log('Password field located...');
        
        const passwordSelector = 'input[type="password"][name="Passwd"]';
        await this.driver.wait(until.elementLocated(By.css(passwordSelector)), 15000);
        const passwordField = await this.driver.wait(
          until.elementIsVisible(await this.driver.findElement(By.css(passwordSelector))),
          15000
        );
        console.log('Password field is visible...');
        await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
        
        console.log('Entering password...');
        for (let char of this.password) {
          await passwordField.sendKeys(char);
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        }

        console.log('Password entered, clicking next...');
        await new Promise(resolve => setTimeout(resolve, this.randomDelay()));
        await this.driver.findElement(By.id('passwordNext')).click();

        await this.driver.wait(until.elementLocated(By.css('body')), 15000);
        console.log('Successfully logged into Google account');
      } catch (error) {
        console.error('Detailed password field error:', error);
        console.error('Current URL:', await this.driver.getCurrentUrl());
        throw error;
      }
    } catch (error) {
      console.error('Login failed with error:', error.message);
      console.error('Current URL:', await this.driver.getCurrentUrl());
      throw new Error('Login process failed - please check your credentials');
    }
  }
  async turnOffMicCam(meetLink) {
    try {
      console.log('🟢 Starting the meeting join process...');
      console.log(`➡️ Navigating to: ${meetLink}`);
      await this.driver.get(meetLink);
      await this.pauseRandom();
  
      // Click on "Sign in" if it exists
      try {
        console.log('🔍 Looking for the sign-in button...');
        const signInButton = await this.driver.wait(
          until.elementLocated(By.css('div.rrdnCc div[role="button"]')),
          15000
        );
        console.log('✅ Sign-in button found! Clicking...');
        await signInButton.click();
        await this.pauseRandom();
      } catch (err) {
        console.log('ℹ️ No sign-in button found. Might already be signed in.');
      }
  
      // Select the Google account
      try {
        console.log('🔍 Checking for the account selector...');
        const accountSelector = await this.driver.wait(
          until.elementLocated(By.css(`div[jsname="MBVUVe"][data-identifier="${this.emailId}"]`)),
          15000
        );
        console.log('✅ Account found. Clicking on it...');
        await accountSelector.click();
        await this.pauseRandom();
      } catch (err) {
        console.log('ℹ️ Could not find account selector. Might have skipped it.');
      }
  
      // Wait for mic/cam buttons
      console.log('🎛️ Waiting for mic and camera controls...');
      await this.driver.wait(
        until.elementLocated(By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]')),
        30000
      );
  
      const controlButtons = await this.driver.findElements(
        By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]')
      );
  
      console.log(`🎯 Found ${controlButtons.length} mic/cam controls. Going through them one by one...`);
  
      for (const button of controlButtons) {
        const ariaLabel = await button.getAttribute('aria-label');
        console.log(`📝 Control: "${ariaLabel}"`);
        if (!ariaLabel.toLowerCase().includes('turn on')) {
          await this.pauseRandom();
          await button.click();
          console.log(`🚫 Toggled off: ${ariaLabel}`);
        } else {
          console.log(`✅ Already off: ${ariaLabel}`);
        }
      }
  
      // Try to find and click "Join" button
      const joinSelectors = [
        'div[jsname="Qx7uuf"]',
        'div[jsname="K4r5Yd"]',
        'div[data-mdc-dialog-action="join"]',
        'div[aria-label*="Ask to join"]',
        'div[aria-label*="Join now"]'
      ];
  
      let joinButton = null;
      for (const selector of joinSelectors) {
        try {
          console.log(`🔎 Trying join selector: ${selector}`);
          await this.driver.wait(until.elementLocated(By.css(selector)), 5000);
          joinButton = await this.driver.findElement(By.css(selector));
          console.log(`✅ Join button found: ${selector}`);
          break;
        } catch (err) {
          console.log(`❌ Join selector not found: ${selector}`);
          continue;
        }
      }
  
      if (!joinButton) {
        throw new Error('🚫 Could not locate the join button.');
      }
  
      console.log('⏳ Waiting for the join button to be clickable...');
      await this.driver.wait(until.elementIsEnabled(joinButton), 10000);
      await this.pauseRandom();
      await joinButton.click();
      console.log('🙋‍♂️ Clicked on "Join" or "Ask to Join". Waiting for response...');
  
      // Handle optional confirmation popups
      const confirmSelectors = [
        'button[jsname="j6LnYe"]',
        'button[data-id="confirm"]',
        'button[aria-label*="confirm"]'
      ];
  
      for (const selector of confirmSelectors) {
        try {
          console.log(`🔎 Checking for confirmation button: ${selector}`);
          const confirmButton = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            3000
          );
          await confirmButton.click();
          console.log('✅ Clicked confirmation button.');
          break;
        } catch {
          // If not found, move on
        }
      }
  
      console.log('🎉 Meeting join sequence completed!');
      return true;
  
    } catch (err) {
      console.error('❗ Error during meeting join:', err.message);
      console.error('🔗 Current page URL:', await this.driver.getCurrentUrl());
      throw new Error('Something went wrong during the meeting setup.');
    }
  }
  
  
  // Helper to simulate human-like pauses
  pauseRandom(min = 800, max = 1500) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  

  async checkIfJoined() {
    try {
      console.log('Checking if joined to meeting...');
      const indicators = [
        'div[data-meeting-title]',
        'div[aria-label*="participant"]', 
        'div[jscontroller*="meeting"]'
      ];
      
      console.log('Looking for meeting indicators...');
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
  console.log('Starting main function...');
  const emailId = process.env.EMAIL_ID;
  const password = process.env.PASSWORD;
  const meetLink = process.env.MEET_LINK;

  console.log('Creating JoinGoogleMeet instance...');
  const meet = new JoinGoogleMeet(emailId, password);
  
  try {
    await meet.init();
    await meet.login();
    await meet.turnOffMicCam(meetLink);

    console.log('Starting meeting monitor...');
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 30000));
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
