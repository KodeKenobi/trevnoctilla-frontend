const { chromium } = require('playwright');

async function testCampaignFlow() {
  console.log('🚀 Starting campaign flow test on PRODUCTION...\n');
  
  const browser = await chromium.launch({ 
    headless: false,  // Show browser so you can see it
    slowMo: 500       // Slow down so you can watch
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Go to website
    console.log('📍 Navigating to https://www.trevnoctilla.com');
    await page.goto('https://www.trevnoctilla.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 2. Find contact page
    console.log('🔍 Looking for contact page...');
    const contactLink = await page.locator('a[href*="contact"]').first();
    if (contactLink) {
      await contactLink.click();
      console.log('✅ Found and clicked contact link');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  No contact link found, staying on homepage');
    }
    
    // 3. LOG ALL FORM FIELDS
    console.log('\n📋 FORM FIELDS FOUND:');
    console.log('========================');
    
    // Find all input fields
    const inputs = await page.locator('input[type="text"], input[type="email"], input[name*="name"], input[name*="email"]').all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      const isVisible = await input.isVisible();
      
      console.log(`\nInput ${i + 1}:`);
      console.log(`  - Name: ${name}`);
      console.log(`  - ID: ${id}`);
      console.log(`  - Type: ${type}`);
      console.log(`  - Placeholder: ${placeholder}`);
      console.log(`  - Visible: ${isVisible}`);
    }
    
    // Find all textarea fields
    const textareas = await page.locator('textarea').all();
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i];
      const name = await textarea.getAttribute('name');
      const id = await textarea.getAttribute('id');
      const placeholder = await textarea.getAttribute('placeholder');
      const isVisible = await textarea.isVisible();
      
      console.log(`\nTextarea ${i + 1}:`);
      console.log(`  - Name: ${name}`);
      console.log(`  - ID: ${id}`);
      console.log(`  - Placeholder: ${placeholder}`);
      console.log(`  - Visible: ${isVisible}`);
    }
    
    // Find submit button
    const submitButtons = await page.locator('button[type="submit"], input[type="submit"], button:has-text("Send"), button:has-text("Submit")').all();
    console.log(`\n🔘 Submit Buttons Found: ${submitButtons.length}`);
    for (let i = 0; i < submitButtons.length; i++) {
      const btn = submitButtons[i];
      const text = await btn.textContent();
      const type = await btn.getAttribute('type');
      console.log(`  - Button ${i + 1}: "${text}" (type: ${type})`);
    }
    
    console.log('\n========================\n');
    
    // 4. FILL THE FORM
    console.log('✍️  Filling form fields...');
    
    // Fill name
    const nameField = await page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
    if (await nameField.isVisible()) {
      await nameField.click();
      await nameField.fill('Test User');
      console.log('✅ Filled name field: Test User');
    } else {
      console.log('❌ Name field not found or not visible');
    }
    
    // Fill email
    const emailField = await page.locator('input[type="email"], input[name*="email" i]').first();
    if (await emailField.isVisible()) {
      await emailField.click();
      await emailField.fill('test@example.com');
      console.log('✅ Filled email field: test@example.com');
    } else {
      console.log('❌ Email field not found or not visible');
    }
    
    // Fill message
    const messageField = await page.locator('textarea').first();
    if (await messageField.isVisible()) {
      await messageField.click();
      await messageField.fill('This is a test message from the automated campaign flow test script.');
      console.log('✅ Filled message field');
    } else {
      console.log('❌ Message field not found or not visible');
    }
    
    await page.waitForTimeout(2000);
    
    // 5. SUBMIT
    console.log('\n📤 Submitting form...');
    const submitButton = await page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      console.log('✅ Clicked submit button');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check for success messages
      const successIndicators = [
        'text=/thank you/i',
        'text=/success/i',
        'text=/sent/i',
        'text=/message.*sent/i',
        '.success-message'
      ];
      
      let foundSuccess = false;
      for (const indicator of successIndicators) {
        const element = await page.locator(indicator).first();
        if (await element.isVisible().catch(() => false)) {
          const text = await element.textContent();
          console.log(`✅ Success message found: "${text}"`);
          foundSuccess = true;
          break;
        }
      }
      
      if (!foundSuccess) {
        console.log('⚠️  No success message detected (but form may have been submitted)');
      }
      
      console.log(`\n📍 Final URL: ${page.url()}`);
      
    } else {
      console.log('❌ Submit button not found or not visible');
    }
    
    console.log('\n✅ Test complete!');
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
}

testCampaignFlow();
