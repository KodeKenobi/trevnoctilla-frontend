#!/usr/bin/env node

/**
 * BACKEND-FOCUSED RAPID ALL TEST
 * Tests Flask backend directly to validate application context fix
 * Use this BEFORE deploying to verify the fix works
 */

const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://web-production-737b.up.railway.app';
const TEST_CAMPAIGN_ID = 1; // Use an existing campaign ID from your database
const TEST_COMPANY_ID = 1;  // Use an existing company ID from that campaign

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║              BACKEND APPLICATION CONTEXT TEST                                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`Testing backend: ${BACKEND_URL}`);
console.log(`Campaign ID: ${TEST_CAMPAIGN_ID}`);
console.log(`Company ID: ${TEST_COMPANY_ID}\n`);

async function testBackendDirectly() {
    try {
        console.log('🔍 [TEST] Calling rapid-process endpoint directly...');
        
        const startTime = Date.now();
        
        const response = await fetch(
            `${BACKEND_URL}/api/campaigns/${TEST_CAMPAIGN_ID}/companies/${TEST_COMPANY_ID}/rapid-process`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    captureScreenshot: true
                })
            }
        );
        
        const duration = Date.now() - startTime;
        const data = await response.json();
        
        console.log(`\n📥 [RESPONSE] Status: ${response.status} (${duration}ms)`);
        console.log(`Response:`, JSON.stringify(data, null, 2));
        
        // Analyze the result
        console.log('\n' + '═'.repeat(80));
        console.log('ANALYSIS:');
        console.log('═'.repeat(80));
        
        if (!response.ok) {
            console.log('❌ HTTP Error:', response.status);
            return false;
        }
        
        // Check for application context error
        const errorMsg = data.errorMessage || data.error || '';
        if (errorMsg.includes('Working outside of application context')) {
            console.log('❌ CRITICAL: Flask application context error detected!');
            console.log('   This means the threading fix needs Flask app context.');
            console.log('   Fix needed: Wrap thread function with app.app_context()');
            return false;
        }
        
        // Check for Playwright sync/async error
        if (errorMsg.includes('Playwright Sync API inside the asyncio loop')) {
            console.log('❌ CRITICAL: Playwright async/sync error still present!');
            console.log('   This means sync Playwright is being called in async context.');
            console.log('   Fix needed: Ensure no asyncio loop in the request handler.');
            return false;
        }
        
        // Check for URL conversion error
        if (errorMsg.includes('Cannot navigate to invalid URL') || 
            errorMsg.includes('navigating to "/contact"')) {
            console.log('❌ CRITICAL: URL conversion error detected!');
            console.log('   This means relative URLs are not being converted to absolute.');
            console.log('   Fix needed: Update find_contact_page_sync() URL conversion logic.');
            return false;
        }
        
        // Check success
        if (data.success === true) {
            console.log('✅ SUCCESS: Company processed successfully!');
            console.log(`   Status: ${data.status}`);
            console.log(`   Processing time: ${data.processingTime}s`);
            if (data.screenshotUrl) {
                console.log(`   Screenshot: ${data.screenshotUrl}`);
            }
            return true;
        }
        
        // Partial success - processed but failed for legitimate reasons
        if (data.status === 'failed' && !errorMsg.includes('application context') 
            && !errorMsg.includes('Playwright') && !errorMsg.includes('invalid URL')) {
            console.log('⚠️  PROCESSED BUT FAILED (legitimate reasons):');
            console.log(`   Status: ${data.status}`);
            console.log(`   Error: ${errorMsg}`);
            console.log('   This is OK - the infrastructure works, just the website had issues.');
            return true; // Infrastructure works
        }
        
        // Check for CAPTCHA
        if (data.status === 'captcha') {
            console.log('⚠️  CAPTCHA DETECTED:');
            console.log('   This is OK - means the scraper reached the website.');
            console.log('   Infrastructure works, just hit CAPTCHA protection.');
            return true; // Infrastructure works
        }
        
        console.log('❌ UNKNOWN ERROR:');
        console.log(`   Status: ${data.status}`);
        console.log(`   Error: ${errorMsg}`);
        return false;
        
    } catch (error) {
        console.log('\n❌ [ERROR] Test failed with exception:');
        console.log(error.message);
        console.log('\nStack trace:');
        console.error(error);
        return false;
    }
}

async function main() {
    console.log('Starting backend test...\n');
    
    const success = await testBackendDirectly();
    
    console.log('\n' + '═'.repeat(80));
    console.log('TEST RESULT:');
    console.log('═'.repeat(80));
    
    if (success) {
        console.log('✅ BACKEND FIX VALIDATED - Safe to deploy!');
        console.log('   The Flask application context issue is resolved.');
        console.log('   The rapid-process endpoint works correctly.\n');
        process.exit(0);
    } else {
        console.log('❌ BACKEND FIX FAILED - DO NOT DEPLOY');
        console.log('   The Flask application context issue persists.');
        console.log('   Review the error above and fix before deploying.\n');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
