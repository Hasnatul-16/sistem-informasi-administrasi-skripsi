import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function getBrowser() {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // Vercel / Production environment
        // Using a remote pack URL to avoid Vercel storage limits and ensure the binary is always found
        const remotePackUrl = 'https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar';

        return await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(remotePackUrl),
            headless: chromium.headless as any,
        });
    } else {
        // Local development environment
        // We use a dynamic import to prevent bundling standard 'puppeteer' in production
        const puppeteer = await import('puppeteer');
        return await puppeteer.default.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });
    }
}
