/**
 * Test Supabase Storage Upload with Authentication
 * This mimics what the backend does to upload screenshots
 */

const { createClient } = require('@supabase/supabase-js');

// These should match what's in Railway backend environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pqdxqvxyrahvongbhtdb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const BUCKET_NAME = 'campaign-screenshots';

console.log('🧪 Testing Supabase Storage Upload with Authentication...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Service Key: ${SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`🪣 Bucket: ${BUCKET_NAME}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testUpload() {
  try {
    // Step 1: Check if we have the service role key
    console.log('1️⃣ Checking environment variables...');
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY is NOT set!');
      console.log('   \n   To test with your Railway key:');
      console.log('   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"; node test-supabase-upload.js\n');
      return false;
    }
    console.log('   ✅ Service role key is set\n');

    // Step 2: Initialize Supabase client
    console.log('2️⃣ Initializing Supabase client...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('   ✅ Client initialized\n');

    // Step 3: List buckets to verify authentication
    console.log('3️⃣ Testing authentication by listing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('   ❌ Authentication FAILED!');
      console.log(`   Error: ${bucketsError.message}`);
      console.log(`   Details:`, bucketsError);
      console.log('\n   This means your SUPABASE_SERVICE_ROLE_KEY is invalid or expired.');
      console.log('   Get the correct key from: https://supabase.com/dashboard/project/pqdxqvxyrahvongbhtdb/settings/api\n');
      return false;
    }
    
    console.log(`   ✅ Authentication successful! Found ${buckets.length} bucket(s):`);
    buckets.forEach(bucket => {
      const isTarget = bucket.name === BUCKET_NAME;
      const emoji = isTarget ? '   🎯' : '   ';
      console.log(`${emoji} ${bucket.name} (${bucket.public ? 'PUBLIC' : 'PRIVATE'})`);
    });
    
    const targetBucket = buckets.find(b => b.name === BUCKET_NAME);
    if (!targetBucket) {
      console.log(`\n   ❌ Bucket "${BUCKET_NAME}" does NOT exist!`);
      console.log('   Create it at: https://supabase.com/dashboard/project/pqdxqvxyrahvongbhtdb/storage/buckets\n');
      return false;
    }
    console.log('');

    // Step 4: Create a test image (1x1 red pixel PNG)
    console.log('4️⃣ Creating test screenshot...');
    const testImage = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test_${timestamp}.png`;
    console.log(`   📸 File: ${filename} (${testImage.length} bytes)\n`);

    // Step 5: Upload the file (using EXACT same options as backend Python code)
    console.log('5️⃣ Uploading to Supabase Storage...');
    console.log('   Using options: { contentType: "image/png", cacheControl: "3600", upsert: true }');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, testImage, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.log('   ❌ Upload FAILED!');
      console.log(`   Error: ${uploadError.message}`);
      console.log(`   Details:`, uploadError);
      console.log('\n   This is the EXACT error your backend is getting!\n');
      return false;
    }

    console.log('   ✅ Upload successful!');
    console.log(`   Path: ${uploadData.path}\n`);

    // Step 6: Get public URL
    console.log('6️⃣ Getting public URL...');
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    console.log('   ✅ Public URL generated!');
    console.log(`   URL: ${publicUrlData.publicUrl}\n`);

    // Step 7: Verify we can access it
    console.log('7️⃣ Verifying public access...');
    const verifyResponse = await fetch(publicUrlData.publicUrl);
    console.log(`   Status: ${verifyResponse.status} ${verifyResponse.ok ? '✅' : '❌'}\n`);

    // Step 8: Cleanup
    console.log('8️⃣ Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filename]);

    if (deleteError) {
      console.log(`   ⚠️  Could not delete: ${deleteError.message}`);
    } else {
      console.log('   ✅ Test file deleted\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ Backend should be able to upload screenshots!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;

  } catch (error) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ UNEXPECTED ERROR!');
    console.log(`Error: ${error.message}`);
    console.log('Stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return false;
  }
}

// Run the test
testUpload()
  .then(success => {
    if (success) {
      console.log('✅ Your Supabase Storage connection is working correctly!');
      console.log('If screenshots still fail in production, check Railway logs for the exact error.\n');
    } else {
      console.log('❌ Fix the issues above before screenshots will work in production.\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
