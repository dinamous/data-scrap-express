// BrowserService.js
const puppeteer = require('puppeteer');

class BrowserService {
    static async getBrowser() {
        if (!BrowserService.browserInstance) {
            console.log('Launching Puppeteer browser...');
            try {
                BrowserService.browserInstance = await puppeteer.launch({
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
                    headless: false, 
                    defaultViewport: null, 
                    ignoreDefaultArgs: ['--disable-extensions'],
                    args: ['--no-sandbox', '--disable-setuid-sandbox','--single-process','--no-zygote'],
                });
                console.log('Puppeteer browser launched successfully.');
            } catch (error) {
                console.error('Error launching Puppeteer browser:', error);
                throw new Error('Failed to launch browser. Check Puppeteer installation and system dependencies.');
            }
        }
        return BrowserService.browserInstance;
    }

    static async closeBrowser(browser) {
        if (browser) {
            await browser.close();
            BrowserService.browserInstance = null;
            console.log('Puppeteer browser closed.');
        }
    }
}

module.exports = BrowserService;