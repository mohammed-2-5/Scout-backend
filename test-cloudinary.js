const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('🔍 Testing Cloudinary Connection...\n');

// Test 1: Check configuration
console.log('📋 Configuration:');
console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET'}\n`);

// Test 2: Ping Cloudinary API
cloudinary.api.ping()
  .then(result => {
    console.log('✅ SUCCESS! Cloudinary connection working!');
    console.log(`   Status: ${result.status}\n`);

    // Test 3: Get account usage
    return cloudinary.api.usage();
  })
  .then(usage => {
    console.log('📊 Account Usage:');
    console.log(`   Plan: ${usage.plan || 'Free'}`);
    console.log(`   Credits Used: ${usage.credits?.usage || 0} / ${usage.credits?.limit || 25}`);
    console.log(`   Bandwidth: ${((usage.bandwidth?.usage || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   Storage: ${((usage.storage?.usage || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`   Resources: ${usage.resources || 0}\n`);

    console.log('🎉 Ready to upload files to Cloudinary!');
    console.log('\nNext step: Run migration');
    console.log('   node migrate-to-cloudinary.js\n');
  })
  .catch(error => {
    console.error('❌ ERROR: Cloudinary connection failed!');
    console.error(`   ${error.message}\n`);
    console.log('Please check your credentials in .env file');
  });
