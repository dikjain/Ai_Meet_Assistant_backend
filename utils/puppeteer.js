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
  
      try {
        const signInButton = await this.driver.wait(
          until.elementLocated(By.css('div.rrdnCc div[role="button"]')),
          10000
        );
        await signInButton.click();
        await this._sleep(this.randomDelay());
      } catch (err) {
        console.log('No sign-in button found');
      }
  
      try {
        const accountSelector = await this.driver.wait(
          until.elementLocated(By.css(`div[jsname="MBVUVe"][data-identifier="${this.emailId}"]`)),
          10000
        );
        await accountSelector.click();
        await this._sleep(this.randomDelay());
      } catch (err) {
        console.log('Account selector not found');
      }
  
      await this.driver.wait(
        until.elementLocated(By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]')),
        20000
      );
  
      const controlButtons = await this.driver.findElements(
        By.css('div[role="button"][aria-label*="microphone"], div[role="button"][aria-label*="camera"]')
      );
  
      for (const button of controlButtons) {
        const ariaLabel = await button.getAttribute('aria-label');
        if (!ariaLabel.toLowerCase().includes('turn on')) {
          await this._sleep(this.randomDelay());
          await button.click();
        }
      }
  
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
          await this.driver.wait(until.elementLocated(By.css(selector)), 3000);
          joinButton = await this.driver.findElement(By.css(selector));
          break;
        } catch (err) {
          continue;
        }
      }
  
      if (!joinButton) {
        throw new Error('Could not locate join button');
      }
  
      await this.driver.wait(until.elementIsEnabled(joinButton), 8000);
      await this._sleep(this.randomDelay());
      await joinButton.click();
  
      const confirmSelectors = [
        'button[jsname="j6LnYe"]',
        'button[data-id="confirm"]',
        'button[aria-label*="confirm"]'
      ];
  
      for (const selector of confirmSelectors) {
        try {
          const confirmButton = await this.driver.wait(
            until.elementLocated(By.css(selector)),
            2000
          );
          await confirmButton.click();
          break;
        } catch {
          // Continue if not found
        }
      }
  
      return true;
    } catch (err) {
      console.error('Error during meeting join:', err.message);
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
