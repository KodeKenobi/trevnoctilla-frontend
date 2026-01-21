#!/usr/bin/env node

/**
 * COMPREHENSIVE RAPID ALL TEST - FOLLOWS EXACT USER FLOW
 * 
 * Tests the COMPLETE user journey:
 * 1. Upload spreadsheet (NO messageTemplate - just file)
 * 2. Create campaign with form data (message REQUIRED)
 * 3. Navigate to campaign detail page
 * 4. Click Rapid All button (guest = auto-start with limit 5)
 * 5. Process 5 companies in PARALLEL (not sequential)
 * 6. Track progress: X/Y completed, Z processing, ETA
 * 7. When one completes → start next pending
 * 8. Verify final results
 * 
 * EXTENSIVE VERBOSE LOGGING FOR EVERYTHING
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Detect environment
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.trevnoctilla.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://web-production-737b.up.railway.app';

// Create log file
const LOG_FILE = path.join(process.cwd(), 'rapid-all-test-logs.txt');
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

// Helper to write to both console and file
function writeLog(message) {
  console.log(message);
  logStream.write(message + '\n');
}

// EXTENSIVE LOGGING
const log = {
  step: (num, title) => {
    writeLog('\n' + '═'.repeat(80));
    writeLog(`STEP ${num}: ${title}`);
    writeLog('═'.repeat(80));
  },
  info: (msg, data) => {
    writeLog(`\n📋 [INFO] ${msg}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
  success: (msg, data) => {
    writeLog(`\n✅ [SUCCESS] ${msg}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
  error: (msg, data) => {
    writeLog(`\n❌ [ERROR] ${msg}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
  warn: (msg, data) => {
    writeLog(`\n⚠️  [WARN] ${msg}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
  api: (method, url, body, headers) => {
    writeLog(`\n🌐 [API CALL] ${method} ${url}`);
    if (headers) {
      const headersObj = typeof headers === 'object' && !Array.isArray(headers) ? headers : {};
      writeLog(`   Headers: ${JSON.stringify(headersObj, null, 2)}`);
    }
    if (body) {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      writeLog(`   Body: ${bodyStr.substring(0, 500)}${bodyStr.length > 500 ? '...' : ''}`);
    }
  },
  apiResponse: (status, data, duration) => {
    writeLog(`\n📥 [API RESPONSE] Status: ${status} (${duration}ms)`);
    writeLog(`   Response: ${JSON.stringify(data, null, 2)}`);
  },
  rapidAll: (msg, data) => {
    writeLog(`\n🚀 [RAPID ALL] ${msg}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
  progress: (current, total, processing, eta, avgTime) => {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    writeLog(`\n📊 [PROGRESS] ${current}/${total} completed (${percent}%) | ${processing} processing | Avg: ${avgTime.toFixed(2)}s | ETA: ${eta}s`);
  },
  company: (id, action, data) => {
    writeLog(`\n🏢 [COMPANY ${id}] ${action}`);
    if (data) writeLog(`   Data: ${JSON.stringify(data, null, 2)}`);
  },
};

let campaignId = null;
let companyIds = [];
let sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Rapid All state tracking (matches frontend)
let rapidAllProgress = 0;
let rapidAllTotal = 0;
let processingCount = 0;
let processingTimes = [];
let avgProcessingTime = 0;
let customProcessingLimit = null;
let isRapidAllRunning = false;
let processingCompanies = new Set(); // Track which companies are currently processing

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function step1_UploadSpreadsheet() {
  log.step(1, 'UPLOAD SPREADSHEET (EXACT USER FLOW)');
  
  log.info('Looking for test-leads.xlsx file...');
  const xlsxPath = path.join(process.cwd(), 'test-leads.xlsx');
  
  if (!fs.existsSync(xlsxPath)) {
    log.error(`test-leads.xlsx not found at: ${xlsxPath}`);
    log.info('Please create test-leads.xlsx with companies');
    return null;
  }

  const fileStats = fs.statSync(xlsxPath);
  log.success(`Found test file: ${xlsxPath}`);
  log.info(`File size: ${(fileStats.size / 1024).toFixed(2)} KB`);
  log.info(`File modified: ${fileStats.mtime}`);

  try {
    log.info('Creating FormData (EXACTLY like frontend)...');
    const form = new FormData();
    form.append('file', fs.createReadStream(xlsxPath));
    
    log.info('FormData created with file');
    log.info('NOTE: Frontend does NOT send campaignName or messageTemplate in upload!');
    log.info('Upload endpoint ONLY validates file, does NOT create campaign');

    log.api('POST', `${BASE_URL}/api/campaigns/upload`, null, form.getHeaders());

    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/campaigns/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    log.apiResponse(response.status, data, duration);

    if (!response.ok || !data.success) {
      log.error(`Upload failed: ${data.message || data.error || 'Unknown error'}`);
      return null;
    }

    log.success('File validated successfully!');
    log.info(`Rows processed: ${data.data.rowsCount || data.data.validRows || 'N/A'}`);
    log.info(`Total rows: ${data.data.totalRows || 'N/A'}`);
    log.info(`Valid rows: ${data.data.validRows || 'N/A'}`);
    log.info(`Invalid rows: ${data.data.invalidRows || 0}`);

    // Store uploaded data (like localStorage in frontend)
    const uploadedData = {
      filename: data.data.filename || 'test-leads.xlsx',
      size: fileStats.size,
      rows: data.data.rows || [],
      totalRows: data.data.totalRows || 0,
      validRows: data.data.validRows || 0,
      invalidRows: data.data.invalidRows || 0,
      uploadedAt: new Date().toISOString(),
    };

    log.info('Uploaded data structure (like localStorage):', uploadedData);
    log.info('Next: User would click "Create Message Template" → redirects to /campaigns/create');

    return uploadedData;
  } catch (error) {
    log.error(`Upload error: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function step2_CreateCampaign(uploadedData) {
  log.step(2, 'CREATE CAMPAIGN WITH FORM DATA (EXACT USER FLOW)');

  log.info('Simulating user filling form on /campaigns/create page...');
  log.info('User would fill:');
  log.info('  - Campaign Name: Required');
  log.info('  - Sender Name: Optional (defaults to "Sender")');
  log.info('  - Sender Email: Optional (defaults to "sender@example.com")');
  log.info('  - Sender Phone: Optional (defaults to "+1 555-0000")');
  log.info('  - Sender Address: Optional (defaults to "")');
  log.info('  - Subject: Optional (defaults to "Inquiry")');
  log.info('  - Message: REQUIRED');

  // Limit to 5 companies for guest user (like frontend does)
  const companiesToUse = uploadedData.rows.slice(0, 5);
  log.info(`Using first ${companiesToUse.length} companies (guest limit: 5)`);
  log.info(`Session ID: ${sessionId}`);

  // Form data (matching frontend defaults)
  const formData = {
    sender_name: "Test Sender", // User would fill this
    sender_email: "test@example.com", // User would fill this
    sender_phone: "+1-555-0000", // User would fill this
    sender_address: "", // Optional
    subject: "Test Inquiry", // User would fill this
    message: "This is a test message for Rapid All testing. Please contact me.", // REQUIRED
  };

  log.info('Form data being sent:', formData);

  const messageTemplate = JSON.stringify(formData);
  log.info('Message template (JSON stringified):', messageTemplate);

  const requestBody = {
    name: 'Rapid All Test Campaign',
    message_template: messageTemplate, // JSON stringified
    companies: companiesToUse,
    session_id: sessionId,
  };

  log.api('POST', `${BASE_URL}/api/campaigns`, requestBody, { 'Content-Type': 'application/json' });

  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    log.apiResponse(response.status, data, duration);

    if (!response.ok || !data.success) {
      log.error(`Campaign creation failed: ${data.error || 'Unknown error'}`);
      return null;
    }

    if (data.campaign && data.campaign.id) {
      campaignId = data.campaign.id;
      log.success(`Campaign created successfully!`);
      log.info(`Campaign ID: ${campaignId}`);
      log.info(`Campaign name: ${data.campaign.name || 'N/A'}`);
      log.info(`Total companies: ${data.campaign.total_companies || companiesToUse.length}`);
      log.info(`Status: ${data.campaign.status || 'N/A'}`);
      log.info('Next: User would be redirected to /campaigns/' + campaignId);
      return data.campaign;
    } else {
      log.error('Campaign created but no ID returned');
      return null;
    }
  } catch (error) {
    log.error(`Campaign creation error: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function step3_FetchCampaignDetails() {
  log.step(3, 'FETCH CAMPAIGN DETAILS (LIKE CAMPAIGN DETAIL PAGE)');

  log.info(`Fetching campaign ${campaignId} details...`);
  log.api('GET', `${BASE_URL}/api/campaigns/${campaignId}`, null, {});

  try {
    const startTime = Date.now();
    const campaignResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
    const duration = Date.now() - startTime;
    const campaignData = await campaignResponse.json();

    log.apiResponse(campaignResponse.status, campaignData, duration);

    if (!campaignResponse.ok || !campaignData.success) {
      log.error(`Failed to fetch campaign: ${campaignData.message || campaignData.error}`);
      return null;
    }

    const campaign = campaignData.campaign;
    log.success(`Campaign found: ${campaign.name || 'Unnamed'}`);
    log.info(`Total companies: ${campaign.total_companies || 0}`);
    log.info(`Status: ${campaign.status || 'N/A'}`);
    log.info(`Processed: ${campaign.processed_count || 0}`);
    log.info(`Success: ${campaign.success_count || 0}`);
    log.info(`Failed: ${campaign.failed_count || 0}`);

    // Fetch companies separately (like frontend does)
    log.info(`Fetching companies for campaign ${campaignId}...`);
    log.api('GET', `${BASE_URL}/api/campaigns/${campaignId}/companies`, null, {});

    const companiesStartTime = Date.now();
    const companiesResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/companies`);
    const companiesDuration = Date.now() - companiesStartTime;
    const companiesData = await companiesResponse.json();

    log.apiResponse(companiesResponse.status, companiesData, companiesDuration);

    if (!companiesResponse.ok || !companiesData.success) {
      log.error(`Failed to fetch companies: ${companiesData.message || companiesData.error}`);
      return campaign;
    }

    // Get pending company IDs
    if (companiesData.companies && Array.isArray(companiesData.companies)) {
      const allCompanies = companiesData.companies;
      companyIds = allCompanies
        .filter(c => c.status === 'pending')
        .map(c => c.id);

      log.success(`Found ${allCompanies.length} total companies`);
      log.info(`Pending companies: ${companyIds.length}`);
      log.info(`Company IDs: ${companyIds.join(', ')}`);

      // Show status breakdown
      const statusBreakdown = {};
      allCompanies.forEach(c => {
        statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
      });
      log.info('Company status breakdown:', statusBreakdown);

      if (companyIds.length === 0) {
        log.warn('No pending companies found. All companies may already be processed.');
      }
    } else {
      log.warn('No companies array in response');
    }

    return campaign;
  } catch (error) {
    log.error(`Fetch error: ${error.message}`);
    return null;
  }
}

async function rapidProcessCompany(companyId) {
  const startTime = Date.now();
  
  log.company(companyId, 'STARTING PROCESSING', {
    timestamp: new Date().toISOString(),
    rapidAllProgress: `${rapidAllProgress}/${rapidAllTotal}`,
    processingCount: processingCount,
  });

  processingCompanies.add(companyId);
  processingCount++;
  
  try {
    const requestBody = { companyId };
    log.api('POST', `${BASE_URL}/api/campaigns/${campaignId}/rapid-process`, requestBody, {
      'Content-Type': 'application/json',
    });

    const response = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/rapid-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const processingTime = (Date.now() - startTime) / 1000;
    const data = await response.json();

    log.apiResponse(response.status, data, Date.now() - startTime);

    // Track processing time for ETA
    processingTimes.push(processingTime);
    if (processingTimes.length > 10) {
      processingTimes.shift(); // Keep only last 10
    }
    avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;

    // Update progress
    rapidAllProgress++;
    processingCount--;
    processingCompanies.delete(companyId);

    log.company(companyId, 'COMPLETED', {
      status: data.status,
      processingTime: `${processingTime.toFixed(2)}s`,
      screenshotUrl: data.screenshotUrl || 'none',
      errorMessage: data.errorMessage || 'none',
      rapidAllProgress: `${rapidAllProgress}/${rapidAllTotal}`,
      avgProcessingTime: `${avgProcessingTime.toFixed(2)}s`,
    });

    return { success: data.success !== false && !data.error, data, processingTime };
  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    processingCount--;
    processingCompanies.delete(companyId);

    log.company(companyId, 'ERROR', {
      error: error.message,
      processingTime: `${processingTime.toFixed(2)}s`,
    });

    rapidAllProgress++;
    return { success: false, error: error.message, processingTime };
  }
}

async function step4_RapidAll() {
  log.step(4, 'CLICK RAPID ALL BUTTON (EXACT USER FLOW)');

  const pendingCompanies = companyIds.filter(id => !processingCompanies.has(id));
  
  log.rapidAll('User clicked "Rapid All" button');
  log.info(`Pending companies: ${pendingCompanies.length}`);
  log.info(`Company IDs: ${pendingCompanies.join(', ')}`);

  if (pendingCompanies.length === 0) {
    log.error('No pending companies to process!');
    return null;
  }

  // Guest user: auto-start with limit 5 (no modal)
  log.info('User type: Guest (no authentication)');
  log.info('Guest users get automatic limit of 5 (no modal shown)');
  
  const limit = 5;
  customProcessingLimit = limit;
  rapidAllTotal = Math.min(limit, pendingCompanies.length);
  rapidAllProgress = 0;
  processingCount = 0;
  processingTimes = [];
  avgProcessingTime = 0;
  isRapidAllRunning = true;

  log.rapidAll('Starting Rapid All processing', {
    limit: limit,
    total: rapidAllTotal,
    parallelCount: 5,
  });

  // Start 5 companies in parallel (or fewer if less than 5 pending)
  const PARALLEL_COUNT = 5;
  const initialBatch = pendingCompanies.slice(0, Math.min(PARALLEL_COUNT, limit));
  
  log.rapidAll(`Starting initial batch of ${initialBatch.length} companies in parallel`);
  log.info(`Company IDs in batch: ${initialBatch.join(', ')}`);

  const results = [];
  const startTime = Date.now();

  // Start all companies in parallel
  const promises = initialBatch.map(companyId => {
    return rapidProcessCompany(companyId).then(result => {
      results.push({ companyId, ...result });

      // Update progress display
      const remaining = rapidAllTotal - rapidAllProgress;
      const eta = remaining > 0 ? Math.ceil(remaining * avgProcessingTime / PARALLEL_COUNT) : 0;
      log.progress(rapidAllProgress, rapidAllTotal, processingCount, eta, avgProcessingTime);

      // Check if we should start next company
      if (isRapidAllRunning) {
        const currentProgress = rapidAllProgress;
        const currentLimit = customProcessingLimit;

        if (currentLimit && currentProgress >= currentLimit) {
          // Reached limit
          if (processingCount === 0) {
            isRapidAllRunning = false;
            log.rapidAll('Limit reached. Stopping.', { progress: currentProgress, limit: currentLimit });
          }
        } else {
          // Start next pending company
          const nextPending = pendingCompanies.find(id => 
            !processingCompanies.has(id) && !results.some(r => r.companyId === id)
          );

          if (nextPending) {
            log.rapidAll(`Starting next pending company: ${nextPending}`, {
              progress: `${currentProgress}/${currentLimit}`,
            });
            return rapidProcessCompany(nextPending).then(nextResult => {
              results.push({ companyId: nextPending, ...nextResult });
              const remaining = rapidAllTotal - rapidAllProgress;
              const eta = remaining > 0 ? Math.ceil(remaining * avgProcessingTime / PARALLEL_COUNT) : 0;
              log.progress(rapidAllProgress, rapidAllTotal, processingCount, eta, avgProcessingTime);
            });
          } else {
            // No more pending
            if (processingCount === 0) {
              isRapidAllRunning = false;
              log.rapidAll('All companies processed!', {
                progress: `${rapidAllProgress}/${rapidAllTotal}`,
              });
            }
          }
        }
      }

      return result;
    });
  });

  // Wait for all initial batch to complete
  await Promise.all(promises);

  // Wait for any remaining processing to complete
  while (processingCount > 0) {
    log.info(`Waiting for ${processingCount} companies to finish processing...`);
    await sleep(500);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  log.rapidAll('Rapid All processing completed', {
    totalDuration: `${totalDuration}s`,
    progress: `${rapidAllProgress}/${rapidAllTotal}`,
  });

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  log.info('\n📊 RAPID ALL RESULTS:');
  log.info(`✅ Success: ${successCount}/${results.length}`);
  log.info(`❌ Failed: ${failCount}/${results.length}`);
  log.info(`⏱️  Total time: ${totalDuration}s`);
  log.info(`📈 Avg per company: ${(totalDuration / results.length).toFixed(2)}s`);
  log.info(`⚡ Parallel processing: ${PARALLEL_COUNT} companies at once`);

  return results;
}

async function step5_VerifyFinalStatus() {
  log.step(5, 'VERIFY FINAL CAMPAIGN STATUS');

  log.info(`Fetching final campaign status...`);
  log.api('GET', `${BASE_URL}/api/campaigns/${campaignId}`, null, {});

  try {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
    const duration = Date.now() - startTime;
    const data = await response.json();

    log.apiResponse(response.status, data, duration);

    if (!response.ok || !data.success) {
      log.error(`Failed to fetch final status: ${data.message || data.error}`);
      return null;
    }

    const campaign = data.campaign;
    log.success('\n📊 FINAL CAMPAIGN STATUS:');
    log.info(`Total companies: ${campaign.total_companies || 0}`);
    log.info(`Processed: ${campaign.processed_count || 0}`);
    log.info(`Success: ${campaign.success_count || 0}`);
    log.info(`Failed: ${campaign.failed_count || 0}`);
    log.info(`Progress: ${campaign.progress_percentage || 0}%`);

    // Fetch companies to check statuses
    log.api('GET', `${BASE_URL}/api/campaigns/${campaignId}/companies`, null, {});
    const companiesResponse = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/companies`);
    const companiesData = await companiesResponse.json();

    if (companiesData.companies) {
      const completed = companiesData.companies.filter(c => c.status === 'completed').length;
      const failed = companiesData.companies.filter(c => c.status === 'failed').length;
      const pending = companiesData.companies.filter(c => c.status === 'pending').length;
      const processing = companiesData.companies.filter(c => c.status === 'processing').length;

      log.info('\n📋 COMPANY STATUS BREAKDOWN:');
      log.info(`✅ Completed: ${completed}`);
      log.info(`❌ Failed: ${failed}`);
      log.info(`⏳ Pending: ${pending}`);
      log.info(`🔄 Processing: ${processing}`);

      // Check error messages are user-friendly
      const failedCompanies = companiesData.companies.filter(c => c.status === 'failed');
      if (failedCompanies.length > 0) {
        log.info('\n🔍 CHECKING ERROR MESSAGES (should be user-friendly):');
        failedCompanies.forEach(c => {
          const errorMsg = c.error_message || 'No error message';
          const isTechnical = errorMsg.includes('event loop') || 
                             errorMsg.includes('Playwright') || 
                             errorMsg.includes('asyncio') ||
                             errorMsg.includes('Protocol error');
          
          if (isTechnical) {
            log.error(`❌ Technical error found: "${errorMsg}"`);
          } else {
            log.success(`✅ User-friendly: "${errorMsg}"`);
          }
        });
      }

      // Show screenshots
      const companiesWithScreenshots = companiesData.companies.filter(c => c.screenshot_url);
      if (companiesWithScreenshots.length > 0) {
        log.info(`\n📸 SCREENSHOTS CAPTURED: ${companiesWithScreenshots.length}`);
        companiesWithScreenshots.forEach(c => {
          log.info(`   Company ${c.id}: ${c.screenshot_url}`);
        });
      }
    }

    return campaign;
  } catch (error) {
    log.error(`Verification error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.clear();
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║     RAPID ALL COMPREHENSIVE TEST - EXACT USER FLOW WITH VERBOSE LOGGING      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  log.info('Configuration:');
  log.info(`Log file: ${LOG_FILE}`);
  log.info(`Frontend API (Next.js): ${BASE_URL}`);
  log.info(`Backend API (Flask): ${BACKEND_URL} (for reference only)`);
  log.info(`Test file: test-leads.xlsx`);
  log.info(`Session ID (guest): ${sessionId}`);
  
  if (BASE_URL.includes('localhost')) {
    log.warn('⚠️  Using localhost - make sure both frontend and backend servers are running!');
  }

  // Step 1: Upload spreadsheet (NO messageTemplate)
  const uploadResult = await step1_UploadSpreadsheet();
  if (!uploadResult) {
    log.error('❌ TEST FAILED: Upload failed');
    log.info(`\n📄 Full logs saved to: ${LOG_FILE}`);
    logStream.end();
    process.exit(1);
  }

  await sleep(1000);

  // Step 2: Create campaign with form data
  const campaign = await step2_CreateCampaign(uploadResult);
  if (!campaign) {
    log.error('❌ TEST FAILED: Could not create campaign');
    log.info(`\n📄 Full logs saved to: ${LOG_FILE}`);
    logStream.end();
    process.exit(1);
  }

  await sleep(1000);

  // Step 3: Fetch campaign details
  const campaignDetails = await step3_FetchCampaignDetails();
  if (!campaignDetails) {
    log.error('❌ TEST FAILED: Could not fetch campaign details');
    log.info(`\n📄 Full logs saved to: ${LOG_FILE}`);
    logStream.end();
    process.exit(1);
  }

  if (companyIds.length === 0) {
    log.error('❌ TEST FAILED: No pending companies found');
    log.info(`\n📄 Full logs saved to: ${LOG_FILE}`);
    logStream.end();
    process.exit(1);
  }

  // Step 4: Rapid All (parallel processing)
  const rapidAllResults = await step4_RapidAll();

  await sleep(2000);

  // Step 5: Verify final status
  await step5_VerifyFinalStatus();

  // Summary
  log.step(6, 'TEST SUMMARY');

  const successCount = rapidAllResults?.filter(r => r.success).length || 0;
  const totalCount = rapidAllResults?.length || 0;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  log.info(`Campaign ID: ${campaignId}`);
  log.info(`Companies tested: ${totalCount}`);
  log.info(`Success rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);

  if (successCount === totalCount) {
    log.success('\n🎉 ALL TESTS PASSED!');
  } else if (successCount > 0) {
    log.warn('\n⚠️  PARTIAL SUCCESS - Some companies failed');
  } else {
    log.error('\n❌ ALL TESTS FAILED');
  }

  log.info(`\n📄 Full logs saved to: ${LOG_FILE}`);
  console.log('\n');
  
  // Close log stream
  logStream.end();
}

main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  logStream.end();
  process.exit(1);
});
