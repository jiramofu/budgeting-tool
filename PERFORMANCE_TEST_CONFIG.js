/**
 * Performance Testing Configuration
 * Run with: artillery quick --count 100 --num 50 http://localhost:5000/api/health
 * Or: k6 run performance-test-config.js
 *
 * This file contains configurations for load and performance testing
 */

// ==========================================
// ARTILLERY.IO CONFIGURATION
// ==========================================
module.exports = {
  config: {
    target: 'http://localhost:5000',
    phases: [
      { duration: 30, arrivalRate: 5, name: 'Warm up' },
      { duration: 60, arrivalRate: 20, name: 'Ramp up' },
      { duration: 120, arrivalRate: 50, name: 'Sustained load' },
      { duration: 30, arrivalRate: 5, name: 'Cool down' },
    ],
    processor: './performance-processor.js',
    plugins: {
      expect: {},
    },
  },
  scenarios: [
    {
      name: 'Health Check Test',
      flow: [
        {
          get: {
            url: '/api/health',
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },
    {
      name: 'Authentication & Settings Flow',
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'password123',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          get: {
            url: '/api/user/settings',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          post: {
            url: '/api/user/settings',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            json: {
              currency: 'USD',
              theme: 'dark',
              language: 'en',
            },
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },
    {
      name: 'Budget Operations',
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'password123',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
          },
        },
        {
          get: {
            url: '/api/budgets/current',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          get: {
            url: '/api/categories',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          get: {
            url: '/api/transactions',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },
    {
      name: 'Analytics & Reports',
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'password123',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
          },
        },
        {
          get: {
            url: '/api/analytics',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          get: {
            url: '/api/reports',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
        {
          get: {
            url: '/api/search?q=test',
            headers: {
              Authorization: 'Bearer {{ authToken }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },
  ],
};

// ==========================================
// K6 CONFIGURATION (Alternative)
// ==========================================
/*
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Warm up to 20 users
    { duration: '1m30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Sustained load at 100 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

const healthCheckDuration = new Trend('health_check_duration');
const settingsDuration = new Trend('settings_duration');
const errorRate = new Rate('error_rate');

export default function () {
  group('Health Check', function () {
    const res = http.get('http://localhost:5000/api/health');
    healthCheckDuration.add(res.timings.duration);
    errorRate.add(res.status !== 200);

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 50ms': (r) => r.timings.duration < 50,
    });
  });

  sleep(1);

  group('Settings Operations', function () {
    const loginRes = http.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    const token = loginRes.json().token;
    const headers = { Authorization: `Bearer ${token}` };

    const settingsRes = http.get('http://localhost:5000/api/user/settings', {
      headers,
    });

    settingsDuration.add(settingsRes.timings.duration);
    errorRate.add(settingsRes.status !== 200);

    check(settingsRes, {
      'settings status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
      'has currency field': (r) => r.json().currency !== null,
    });
  });

  sleep(1);
}
*/
