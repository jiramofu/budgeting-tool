import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5002/api',
  validateStatus: () => true,
});

(async () => {
  try {
    console.log('Starting request...');
    const response = await client.post('/search', { filters: {} }, {
      headers: { 'Authorization': 'Bearer test' }
    });
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
