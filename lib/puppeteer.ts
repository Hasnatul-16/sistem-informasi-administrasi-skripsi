import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';

/**
 * Launch puppeteer browser with environment-aware configuration.
 * - In production (Vercel): use @sparticuz/chromium
 * - In development (local): use local Chrome/Chromium
 */
export async function launchBrowser(): Promise<Browser> {
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';

    // Try Vercel/serverless chromium first in production
    if (isVercel || isProduction) {
        try {
            const browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                headless: true,
            });
            return browser;
        } catch (err) {
            console.warn('Serverless chromium failed, trying local Chrome...', err);
        }
    }

    // Local development - find Chrome executable
    const possiblePaths = [
        process.env.CHROME_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean) as string[];

    let chromePath: string | undefined;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            chromePath = p;
            break;
        }
    }

    if (!chromePath) {
        throw new Error('Chrome/Chromium not found. Please install Chrome or set CHROME_PATH environment variable.');
    }

    console.log('Using local Chrome at:', chromePath);

    const browser = await puppeteer.launch({
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        headless: true,
    });

    return browser;
}
