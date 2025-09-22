const axios = require('axios');

async function testCounselorsEndpoint() {
  try {
    console.log('Testing counselors endpoint...');
    
    const response = await axios.get('http://localhost:3002/api/counselors', {
      headers: {
        'x-auth-token': 'test'
      }
    });
    
    console.log('✅ HTTP Request successful!');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    console.log('First item:', response.data?.[0] ? 'Present' : 'Missing');
    
    if (response.data && response.data.length > 0) {
      console.log('Sample counselor:', {
        id: response.data[0]._id,
        name: response.data[0].name,
        firstName: response.data[0].firstName,
        lastName: response.data[0].lastName
      });
    }
    
  } catch (error) {
    console.error('❌ HTTP Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Also test the requests endpoint
async function testRequestsEndpoint() {
  try {
    console.log('\nTesting requests endpoint...');
    
    const response = await axios.get('http://localhost:3002/api/requests', {
      headers: {
        'x-auth-token': 'test'
      }
    });
    
    console.log('✅ Requests HTTP Request successful!');
    console.log('Status:', response.status);
    console.log('Data type:', typeof response.data);
    console.log('Data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
    
  } catch (error) {
    console.error('❌ Requests HTTP Request failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Server might not be running.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  await testCounselorsEndpoint();
  await testRequestsEndpoint();
}

runTests();
