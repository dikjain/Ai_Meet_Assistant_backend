import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

puppeteer.use(StealthPlugin());

class JoinGoogleMeet {
  constructor(emailId, password) {
    this.emailId = emailId;
    this.password = password;
    this.driver = null;
    // Generate unique directory name using timestamp and random string
    const uniqueId = crypto.randomBytes(4).toString('hex');
    const timestamp = Date.now();
    this.userDataDir = path.join(process.cwd(), 'chrome-user-data', `${emailId}-${timestamp}-${uniqueId}`);
    console.log('JoinGoogleMeet instance created');
  }

  async init() {
    try {
      console.log('Initializing Chrome driver...');
      const options = new chrome.Options();

      // Create user data directory if it doesn't exist
      if (!fs.existsSync(this.userDataDir)) {
        fs.mkdirSync(this.userDataDir, { recursive: true });
        console.log(`Created user data directory: ${this.userDataDir}`);
      }

      options.addArguments(
        `--user-data-dir=${this.userDataDir}`,
        '--disable-blink-features=AutomationControlled',
        '--start-maximized', 
        // '--headless=chrome',
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
        '--disk-cache-size=0',
      );

      options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Set binary path for Chrome in Docker
      if (process.platform === 'win32') {
        // For Windows, let Selenium Manager handle the binary path
        console.log('Running on Windows - using default Chrome installation');
      } else {
        // For Docker/Linux environments
        options.setChromeBinaryPath(process.env.CHROME_BIN || '/usr/bin/google-chrome');
      }

      console.log('Building Chrome driver with options...');
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

      // Add stealth scripts
      await this.driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
      await this.driver.executeScript("navigator.plugins.length = 3");
      await this.driver.executeScript("navigator.languages = ['en-US', 'en']");

      // Simplified random delay function
      this.randomDelay = () => Math.floor(Math.random() * 1500 + 500);
      console.log('Chrome driver initialized successfully');
    } catch (error) {
      console.error('Failed to initialize driver:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  async isLoggedIn() {
    try {
      await this.driver.get('https://myaccount.google.com/');
      await this.driver.wait(until.elementLocated(By.css('a[href*="SignOutOptions"]')), 10000);
      return true;
    } catch {
      return false;
    }
  }

  async login() {
    try {
      console.log('Starting login process...');
      await this.driver.get('https://accounts.google.com/ServiceLogin');
      await this._sleep(this.randomDelay());

      try {
        const emailField = await this.driver.wait(until.elementLocated(By.id('identifierId')), 10000);
        await this._typeSlowly(emailField, this.emailId);
      } catch (error) {
        console.error('Email field error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
        await this.cleanup();
        throw error;
      }

      await this._sleep(this.randomDelay());
      
      try {
        await this.driver.findElement(By.id('identifierNext')).click();
      } catch (error) {
        console.error('Next button error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
        await this.cleanup();
        throw error;
      }

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
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
        await this.cleanup();
        throw error;
      }
    } catch (error) {
      console.error('Login failed:', error.message);
      await this.cleanup();
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
        const signInButton = await this.driver.wait(
          until.elementLocated(By.css('div.rrdnCc div[role="button"]')),
          15000
        );
        await signInButton.click();
        await this._sleep(this.randomDelay());
        
        // Select account if needed
        try {
          const accountSelector = await this.driver.wait(
            until.elementLocated(By.css(`div[data-identifier="${this.emailId}"]`)),
            15000
          );
          await accountSelector.click();
          await this._sleep(this.randomDelay());
        } catch (error) {
          console.log('Account selector not found, going to meet URL directly...');
          await this.driver.get(meetLink);
          await this._sleep(this.randomDelay());
          const elements = await this.driver.findElements(By.css('input, button, div'));
          console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
  
        }
      } catch (error) {
        console.log('Already signed in, continuing...');
      }
  
      // Wait for meeting interface to load
      console.log('Waiting for meeting interface...');
      try {
        await this.driver.wait(
          until.elementLocated(By.css('div[role="button"][aria-label*="microphone"]')),
          15000
        );
      } catch (error) {
        console.error('Meeting interface load error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
        throw error;
      }
  
      // Turn off microphone if it's on
      try {
        const micButton = await this.driver.findElement(By.css('div[role="button"][aria-label*="microphone"]'));
        const micStatus = await micButton.getAttribute('aria-label');
        if (!micStatus.toLowerCase().includes('turn on')) {
          await micButton.click();
          await this._sleep(500);
        }
      } catch (error) {
        console.error('Microphone control error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
      }
      
      // Turn off camera if it's on
      try {
        const camButton = await this.driver.findElement(By.css('div[role="button"][aria-label*="camera"]'));
        const camStatus = await camButton.getAttribute('aria-label');
        if (!camStatus.toLowerCase().includes('turn on')) {
          await camButton.click();
          await this._sleep(500);
        }
      } catch (error) {
        console.error('Camera control error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
      }
  
      // Find and click join button - using the most reliable selector
      console.log('Looking for join button...');
      try {
        const joinButton = await this.driver.wait(
          until.elementLocated(By.css('div[jsname="Qx7uuf"], div[jsname="K4r5Yd"], div[aria-label*="Join now"], div[aria-label*="Ask to join"]')),
          15000
        );
        await this.driver.wait(until.elementIsEnabled(joinButton), 5000);
        await joinButton.click();
        console.log('Join button clicked');
      } catch (error) {
        console.error('Join button error:', error.message);
        const elements = await this.driver.findElements(By.css('input, button, div'));
        console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
        throw error;
      }
  
      // Handle confirmation dialog if it appears
      try {
        const confirmButton = await this.driver.wait(
          until.elementLocated(By.css('button[jsname="j6LnYe"]')),
          2000
        );
        await confirmButton.click();
        console.log('Confirmation dialog handled');
      } catch (error) {
        console.log('No confirmation needed');
      }
  
      console.log('Successfully joined meeting');
      return true;
    } catch (err) {
      console.error('Error during meeting join:', err.message);
      await this.cleanup();
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
      const elements = await this.driver.findElements(By.css('input, button, div'));
      console.log('Page elements:', await Promise.all(elements.map(e => e.getAttribute('outerHTML'))));
      return false;
    }
  }

  async cleanup() {
    if (this.driver) {
      try {
        await this.driver.quit();
        // Clean up user data directory after session ends
        if (fs.existsSync(this.userDataDir)) {
          fs.rmSync(this.userDataDir, { recursive: true, force: true });
          console.log(`Cleaned up user data directory: ${this.userDataDir}`);
        }
      } catch (error) {
        console.error('Error while closing driver:', error.message);
      } finally {
        this.driver = null;
      }
    }
  }
}

async function main() {
  const meet = new JoinGoogleMeet(emailId, password);
  
  try {
    await meet.init();
    
    if (!(await meet.isLoggedIn())) {
      await meet.login();
    } else {
      console.log('Already logged in using stored session');
    }

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
    await meet.cleanup();
  }
}

export { JoinGoogleMeet, main };
