import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow sufficient time for multiple websites

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'screenshots', 'leads');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const senderInfo = {
      firstName: formData.get('firstName') || 'Lead',
      lastName: formData.get('lastName') || 'Processor',
      email: formData.get('email') || 'leads@example.com',
      phone: formData.get('phone') || '0123456789',
      subject: formData.get('subject') || 'Business Inquiry',
      message: formData.get('message') || 'I am interested in your services. Please contact me.',
    };

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(firstSheet);

    // Extract URLs from any column containing 'url' or 'website'
    const urls = data.map(row => {
      const entry = Object.entries(row).find(([key]) => 
        key.toLowerCase().includes('url') || key.toLowerCase().includes('website')
      );
      return entry ? (entry[1] as string) : null;
    }).filter(url => url && url.startsWith('http'));

    if (urls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs found in file' }, { status: 400 });
    }

    const results = [];
    const browser = await chromium.launch({ headless: true });

    for (const url of urls) {
      const page = await browser.newPage();
      try {
        console.log(`Processing: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Heuristic to find contact page if not already on it
        const contactLink = await page.$('a[href*="contact"], a:has-text("Contact")');
        if (contactLink) {
          await contactLink.click();
          await page.waitForLoadState('domcontentloaded');
        }

        // Find and fill forms
        const forms = await page.$$('form');
        let formFilled = false;

        for (const form of forms) {
          const inputs = await form.$$('input, textarea, select');
          for (const input of inputs) {
            const type = await input.getAttribute('type');
            const name = (await input.getAttribute('name') || '').toLowerCase();
            const id = (await input.getAttribute('id') || '').toLowerCase();
            const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
            const label = (await input.evaluate(el => el.labels?.[0]?.innerText || '')).toLowerCase();

            const combinedText = `${name} ${id} ${placeholder} ${label}`;

            if (combinedText.includes('first') || combinedText.includes('fname')) {
              await input.fill(senderInfo.firstName as string);
            } else if (combinedText.includes('last') || combinedText.includes('lname')) {
              await input.fill(senderInfo.lastName as string);
            } else if (combinedText.includes('email') || type === 'email') {
              await input.fill(senderInfo.email as string);
            } else if (combinedText.includes('phone') || combinedText.includes('tel') || type === 'tel') {
              await input.fill(senderInfo.phone as string);
            } else if (combinedText.includes('subject')) {
              await input.fill(senderInfo.subject as string);
            } else if (input.evaluate(el => el.tagName === 'TEXTAREA') || combinedText.includes('message')) {
              await input.fill(senderInfo.message as string);
            } else if (combinedText.includes('name')) {
              await input.fill(`${senderInfo.firstName} ${senderInfo.lastName}`);
            }
          }
          formFilled = true;
        }

        // Take screenshot
        const screenshotName = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        results.push({
          url,
          status: formFilled ? 'Filled' : 'No Form Found',
          screenshot: `/screenshots/leads/${screenshotName}`
        });

      } catch (e: any) {
        results.push({ url, status: 'Error', error: e.message });
      } finally {
        await page.close();
      }
    }

    await browser.close();
    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error('Leads Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
