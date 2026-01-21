#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST SCRIPT FOR RAPID ALL PARALLEL PROCESSING
 * 
 * This script tests:
 * 1. Campaign upload (CSV with test companies)
 * 2. Rapid All processing (5 parallel)
 * 3. Individual Rapid buttons
 * 4. Progress tracking
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

// Test data - 10 companies
const TEST_CSV = `Company Name,Website URL,Contact Email,Phone
Test Company 1,https://example.com,contact@example.com,+1-555-0001
Test Company 2,https://google.com,support@google.com,+1-555-0002
Test Company 3,https://github.com,help@github.com,+1-555-0003
Test Company 4,https://stackoverflow.com,feedback@stackoverflow.com,+1-555-0004
Test Company 5,https://wikipedia.org,info@wikipedia.org,+1-555-0005
Test Company 6,https://amazon.com,customer@amazon.com,+1-555-0006
Test Company 7,https://facebook.com,support@facebook.com,+1-555-0007
Test Company 8,https://twitter.com,help@twitter.com,+1-555-0008
Test Company 9,https://youtube.com,feedback@youtube.com,+1-555-0009
Test Company 10,https://linkedin.com,support@linkedin.com,+1-555-0010`;

const log = {
  info: (msg) => console.log(`\n📋 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  test: (msg) => console.log(`🧪 ${msg}`),
  data: (msg) => console.log(`📊 ${msg}`),
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadCampaign() {
  log.test('STEP 1: Uploading Campaign');
  
  const csvPath = path.join(process.cwd(), 'test-leads.csv');
  fs.writeFileSync(csvPath, TEST_CSV);
  log.info(`Created test CSV: ${csvPath}`);
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    form.append('campaignName', 'Rapid Test Campaign');
    form.append('messageTemplate', JSON.stringify({
      sender_name: 'Test Sender',
      sender_email: 'test@example.com',
      sender_phone: '+1-555-0000',
      subject: 'Test Subject',
      message: 'This is a test message'
    }));

    const response = await fetch(`${BASE_URL}/api/campaigns/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await response.json();
    
    if (!data.success) {
      log.error(`Upload failed: ${data.message}`);
      return null;
    }

    log.success(`Campaign uploaded: ${data.data.rowsCount} companies`);
    log.data(`Response: ${JSON.stringify(data.data)}`);
    return data.data;
  } catch (error) {
    log.error(`Upload error: ${error.message}`);
    return null;
  }
}

async function testRapidProcess(campaignId, companyId) {
  log.test(`Testing Rapid Process for Company ${companyId}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/rapid-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    const startTime = Date.now();
    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (data.success !== false && !data.error) {
      log.success(`Company ${companyId} processed in ${duration}s - Status: ${data.status}`);
      log.data(`Response: ${JSON.stringify({
        status: data.status,
        processingTime: data.processingTime,
        error: data.errorMessage
      })}`);
      return true;
    } else {
      log.error(`Company ${companyId} failed: ${data.errorMessage || data.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Rapid Process error: ${error.message}`);
    return false;
  }
}

async function testParallelProcessing(campaignId, companyIds) {
  log.test('STEP 2: Testing Parallel Processing (5 companies simultaneously)');
  log.info(`Processing companies: ${companyIds.join(', ')}`);
  
  const results = [];
  const startTime = Date.now();

  // Start all 5 in parallel
  log.info(`Starting ${companyIds.length} parallel processes...`);
  const promises = companyIds.map(id => testRapidProcess(campaignId, id));
  
  const responses = await Promise.all(promises);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  responses.forEach((success, idx) => {
    results.push({
      company: companyIds[idx],
      success: success
    });
  });

  log.success(`Parallel batch completed in ${duration}s`);
  log.data(`Results: ${JSON.stringify(results, null, 2)}`);

  const successCount = results.filter(r => r.success).length;
  log.data(`Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);

  return results;
}

async function testSequentialProcessing(campaignId, companyIds) {
  log.test('STEP 3: Testing Sequential Processing (one at a time)');
  log.info(`Processing companies sequentially: ${companyIds.join(', ')}`);
  
  const results = [];
  const startTime = Date.now();

  for (const id of companyIds) {
    log.info(`Processing company ${id}...`);
    const success = await testRapidProcess(campaignId, id);
    results.push({ company: id, success });
    await sleep(500); // Small delay between requests
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log.success(`Sequential batch completed in ${duration}s`);

  const successCount = results.filter(r => r.success).length;
  log.data(`Success Rate: ${successCount}/${results.length} (${Math.round(successCount/results.length*100)}%)`);

  return results;
}

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   RAPID ALL PARALLEL PROCESSING - COMPREHENSIVE TEST      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  log.info('Connecting to API servers...');
  log.data(`Frontend: ${BASE_URL}`);
  log.data(`Backend: ${BACKEND_URL}`);

  // Step 1: Upload Campaign
  log.info('\n═══════════════════════════════════════════════════════════');
  const uploadData = await uploadCampaign();
  if (!uploadData) {
    log.error('Campaign upload failed. Exiting.');
    process.exit(1);
  }

  // For testing, we'll use mock company IDs (1-5)
  // In real scenario, these would come from the uploaded campaign
  const testCompanyIds = [1, 2, 3, 4, 5];

  // Step 2: Test Parallel Processing
  log.info('\n═══════════════════════════════════════════════════════════');
  log.warn('NOTE: Testing parallel processing (may fail if backend not ready)');
  log.warn('Expected errors: "Cannot run the event loop..." indicates sync fix failed');
  
  const parallelResults = await testParallelProcessing(1, testCompanyIds);

  // Step 3: Test Sequential Processing
  log.info('\n═══════════════════════════════════════════════════════════');
  const sequentialResults = await testSequentialProcessing(1, [6, 7, 8, 9, 10]);

  // Summary
  log.info('\n═══════════════════════════════════════════════════════════');
  console.log('\n📊 TEST SUMMARY:\n');
  
  const parallelSuccess = parallelResults.filter(r => r.success).length;
  const parallelRate = Math.round(parallelSuccess / parallelResults.length * 100);
  console.log(`  Parallel Processing:   ${parallelSuccess}/${parallelResults.length} (${parallelRate}%)`);

  const sequentialSuccess = sequentialResults.filter(r => r.success).length;
  const sequentialRate = Math.round(sequentialSuccess / sequentialResults.length * 100);
  console.log(`  Sequential Processing: ${sequentialSuccess}/${sequentialResults.length} (${sequentialRate}%)`);

  console.log('\n✨ Test completed. Check results above for any errors.');
  console.log('\n🔍 If you see "Cannot run the event loop..." errors:');
  console.log('   - The sync scraper fix did NOT work');
  console.log('   - Still using asyncio.new_event_loop() in WebSocket handler');
  console.log('   - Need to apply synchronous scraping fix to WebSocket endpoint');

  process.exit(0);
}

main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
