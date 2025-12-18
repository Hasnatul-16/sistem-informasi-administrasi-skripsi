import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function getBrowser() {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        // Vercel / Production environment
        return await puppeteerCore.launch({
            args: (chromium as any).args,
            defaultViewport: (chromium as any).defaultViewport,
            executablePath: await (chromium as any).executablePath(),
            headless: (chromium as any).headless,
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
