import axios from 'axios';

const API_URL = 'http://localhost:5002/api';

const client = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

(async () => {
  try {
    // Signup first
    console.log('Signing up...');
    const signup = await client.post('/auth/signup', {
      email: `debug-${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Debugger',
    });

    if (signup.status !== 201) {
      console.log('Signup failed:', signup.data);
      process.exit(1);
    }

    const token = signup.data.token;
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('Getting categories...');
    const categories = await client.get('/categories');
    console.log('Categories status:', categories.status);
    console.log('Categories data:', categories.data.slice ? categories.data.slice(0, 1) : categories.data);

    console.log('\nMaking search request...');
    const response = await client.post('/search', { filters: {} });
    console.log('Search status:', response.status);
    console.log('Search data:', response.data);
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
