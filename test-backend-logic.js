const { chromium } = require('playwright');

async function testBackendLogic() {
  console.log('🔍 Testing EXACT backend form filling logic...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  try {
    // Navigate to contact page
    console.log('📍 Going to contact page...');
    await page.goto('https://www.trevnoctilla.com/contact', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Data to fill (same as backend)
    const fillData = {
      name: 'Test Company Name',
      email: 'test@business.com',
      phone: '+1 (555) 123-4567',
      company: 'Test Company Name',
      website: 'https://testcompany.com',
      subject: 'Business Inquiry',
      message: 'This is a test message from the automated system.'
    };
    
    let filledFields = 0;
    
    console.log('\n=== TEXT INPUTS ===');
    const textInputs = await page.locator('input[type="text"], input:not([type])').all();
    console.log(`Found ${textInputs.length} text inputs\n`);
    
    for (let i = 0; i < textInputs.length; i++) {
      const inp = textInputs[i];
      
      if (!await inp.isVisible()) {
        console.log(`Input ${i + 1}: HIDDEN - Skipping`);
        continue;
      }
      
      const nameAttr = (await inp.getAttribute('name') || '').toLowerCase();
      const idAttr = (await inp.getAttribute('id') || '').toLowerCase();
      const placeholder = (await inp.getAttribute('placeholder') || '').toLowerCase();
      const ariaLabel = (await inp.getAttribute('aria-label') || '').toLowerCase();
      
      const allAttrs = `${nameAttr} ${idAttr} ${placeholder} ${ariaLabel}`;
      
      console.log(`\nInput ${i + 1}:`);
      console.log(`  name="${nameAttr}"`);
      console.log(`  id="${idAttr}"`);
      console.log(`  placeholder="${placeholder}"`);
      console.log(`  Combined attrs: "${allAttrs}"`);
      
      // Check conditions (EXACT backend logic)
      if (['name', 'full', 'fname', 'first', 'contact'].some(x => allAttrs.includes(x))) {
        console.log(`  ✅ MATCHED: NAME field - Filling with "${fillData.name}"`);
        await inp.click();
        await inp.fill(fillData.name);
        filledFields++;
      } else if (['subject', 'title', 'topic', 'regarding'].some(x => allAttrs.includes(x))) {
        console.log(`  ✅ MATCHED: SUBJECT field - Filling with "${fillData.subject}"`);
        await inp.click();
        await inp.fill(fillData.subject);
        filledFields++;
      } else if (['company', 'organization', 'business'].some(x => allAttrs.includes(x))) {
        console.log(`  ✅ MATCHED: COMPANY field - Filling with "${fillData.company}"`);
        await inp.click();
        await inp.fill(fillData.company);
        filledFields++;
      } else if (['website', 'url', 'site'].some(x => allAttrs.includes(x))) {
        console.log(`  ✅ MATCHED: WEBSITE field - Filling with "${fillData.website}"`);
        await inp.click();
        await inp.fill(fillData.website);
        filledFields++;
      } else {
        console.log(`  ❌ NO MATCH - Skipping`);
      }
    }
    
    console.log('\n\n=== EMAIL INPUTS ===');
    const emailInputs = await page.locator('input[type="email"]').all();
    console.log(`Found ${emailInputs.length} email inputs\n`);
    
    for (let i = 0; i < emailInputs.length; i++) {
      const inp = emailInputs[i];
      if (await inp.isVisible()) {
        console.log(`Email ${i + 1}: ✅ Filling with "${fillData.email}"`);
        await inp.click();
        await inp.fill(fillData.email);
        filledFields++;
      }
    }
    
    console.log('\n\n=== TEXTAREAS ===');
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textareas\n`);
    
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i];
      if (await textarea.isVisible()) {
        console.log(`Textarea ${i + 1}: ✅ Filling with message (${fillData.message.length} chars)`);
        await textarea.click();
        await textarea.fill(fillData.message);
        filledFields++;
      }
    }
    
    console.log(`\n\n🎯 TOTAL FIELDS FILLED: ${filledFields}`);
    
    console.log('\n\n📤 Submitting form...');
    await page.waitForTimeout(2000);
    
    const submitButton = await page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      console.log('✅ Form submitted!');
      await page.waitForTimeout(3000);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testBackendLogic();
