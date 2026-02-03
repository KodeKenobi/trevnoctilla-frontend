const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testLeadsApi() {
  console.log('🚀 Testing Leads API...');
  
  const csvPath = path.join(__dirname, 'test-leads-mock.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Mock CSV file not found!');
    return;
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(csvPath));
  form.append('firstName', 'Test');
  form.append('lastName', 'User');
  form.append('email', 'test@example.com');
  form.append('message', 'This is a test message.');

  try {
    console.log('📤 Sending request to http://localhost:3000/api/leads ...');
    const response = await axios.post('http://localhost:3000/api/leads', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 300000 // 5 minutes (matches maxDuration)
    });

    console.log('✅ API Response Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection Refused! Is the Next.js server running on port 3000?');
      console.log('   Run `npm run dev` in another terminal first.');
    } else if (error.response) {
      console.error(`❌ API Error (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testLeadsApi();
