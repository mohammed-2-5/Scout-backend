const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testAPI() {
  console.log('🧪 Testing Scout Content Backend API\n');
  console.log('='.repeat(50));

  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/health`,
      expected: 200
    },
    {
      name: 'API Root',
      url: BASE_URL,
      expected: 200
    },
    {
      name: 'Get All Content',
      url: `${API_URL}/content`,
      expected: 200
    },
    {
      name: 'Get Content Stats',
      url: `${API_URL}/content/stats`,
      expected: 200
    },
    {
      name: 'Get All Categories',
      url: `${API_URL}/categories`,
      expected: 200
    },
    {
      name: 'Get Category Tree',
      url: `${API_URL}/categories/tree`,
      expected: 200
    },
    {
      name: 'Filter PDFs Only',
      url: `${API_URL}/content?type=pdf`,
      expected: 200
    },
    {
      name: 'Filter Images Only',
      url: `${API_URL}/content?type=image`,
      expected: 200
    },
    {
      name: 'Search Content',
      url: `${API_URL}/content?search=كشافة`,
      expected: 200
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.url);

      if (result.status === test.expected) {
        console.log(`✅ ${test.name}`);
        if (test.name === 'Get Content Stats' && result.data.success) {
          console.log(`   📊 Stats:`, result.data.data);
        }
        if (test.name === 'Get All Content' && result.data.success) {
          console.log(`   📄 Total items: ${result.data.pagination?.total || 0}`);
        }
        if (test.name === 'Get All Categories' && result.data.success) {
          console.log(`   📁 Total categories: ${result.data.data?.length || 0}`);
        }
        passed++;
      } else {
        console.log(`❌ ${test.name} - Expected ${test.expected}, got ${result.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! Your API is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Test file download: ' + API_URL + '/content/1/file');
    console.log('2. Test thumbnail: ' + API_URL + '/content/1/thumbnail');
    console.log('3. Integrate with your mobile app\n');
  } else {
    console.log('⚠️  Some tests failed. Please check:');
    console.log('1. Is the server running? (npm start)');
    console.log('2. Is the database initialized? (npm run init-db)');
    console.log('3. Are files migrated? (npm run migrate)\n');
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Check if server is running first
console.log('🔍 Checking if server is running...\n');

makeRequest(`${BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running!\n');
    testAPI();
  })
  .catch(() => {
    console.log('❌ Server is not running!');
    console.log('\nPlease start the server first:');
    console.log('  npm start\n');
    console.log('Then run this test again:');
    console.log('  node scripts/test-api.js\n');
    process.exit(1);
  });
