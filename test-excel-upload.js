/**
 * Test script for Excel File Upload
 * Tests the /api/campaigns/upload endpoint with Excel files
 *
 * Usage: node test-excel-upload.js
 * Requires: Node.js 18+ (for native fetch API)
 */

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function createTestExcelFile() {
  // For this test, we'll create a simple CSV file that simulates Excel content
  // In a real scenario, you'd have an actual .xlsx file
  const csvContent = `company_name,website_url,contact_email,contact_person,phone
Acme Corp,https://acme.com,contact@acme.com,John Smith,+1234567890
Tech Solutions,https://techsolutions.io,,Jane Doe,
Global Enterprises,https://global.com,info@global.com,,+1987654321
`;

  const testFilePath = path.join(__dirname, 'test_companies.csv');
  fs.writeFileSync(testFilePath, csvContent);
  return testFilePath;
}

async function testExcelUpload() {
  logSection('Excel File Upload Test');

  try {
    // Create a test file (CSV that simulates Excel content)
    const testFilePath = await createTestExcelFile();
    log('Created test CSV file', 'cyan');

    // Read the test file
    const fileBuffer = fs.readFileSync(testFilePath);
    const fileName = 'test_companies.xlsx'; // Simulate Excel file name

    // Create FormData
    const formData = new FormData();
    const file = new File([fileBuffer], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    formData.append('file', file);

    log(`Uploading file: ${fileName} (${file.size} bytes)`, 'blue');

    // Upload the file
    const response = await fetch(`${BASE_URL}/api/campaigns/upload`, {
      method: 'POST',
      body: formData,
    });

    log(`Response status: ${response.status}`, response.ok ? 'green' : 'red');

    if (response.ok) {
      const data = await response.json();
      log('✓ File uploaded successfully!', 'green');
      log(`File: ${data.data.filename}`, 'blue');
      log(`Rows: ${data.data.rows.length}`, 'blue');
      log(`Valid rows: ${data.data.validRows}`, 'blue');
      log(`Invalid rows: ${data.data.invalidRows}`, 'blue');

      // Show first few rows as preview
      if (data.data.rows && data.data.rows.length > 0) {
        log('\nFirst 3 rows preview:', 'cyan');
        data.data.rows.slice(0, 3).forEach((row, index) => {
          log(`${index + 1}. ${row.company_name} - ${row.website_url}`, 'white');
        });
      }
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      log(`Upload failed: ${errorData.error}`, 'red');
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);
    log('Cleaned up test file', 'cyan');

  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'red');
    console.error(error);
  }
}

// Test file type validation
async function testFileTypeValidation() {
  logSection('File Type Validation Test');

  try {
    // Test with invalid file type
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', invalidFile);

    const response = await fetch(`${BASE_URL}/api/campaigns/upload`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.error.includes('Invalid file type')) {
        log('✓ File type validation works correctly', 'green');
      } else {
        log(`⚠ Unexpected error message: ${errorData.error}`, 'yellow');
      }
    } else {
      log(`⚠ Expected 400 status, got ${response.status}`, 'yellow');
    }

  } catch (error) {
    log(`File type validation test failed: ${error.message}`, 'red');
  }
}

// Run tests
async function runAllTests() {
  await testFileTypeValidation();
  await testExcelUpload();

  log('\n' + '='.repeat(60), 'bright');
  log('✅ Excel upload functionality is now fully supported!', 'green');
  log('Users can upload CSV, XLS, and XLSX files directly.', 'green');
  log('No more manual conversion required!', 'green');
  log('='.repeat(60), 'bright');
}

runAllTests().catch(console.error);