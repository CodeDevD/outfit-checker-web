import { proxyUrl } from './config.js';

export async function testProxy() {
  try {
    const response = await fetch(`${proxyUrl}/api/proxyTest.js`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response of proxy:', data);
  } catch (error) {
    console.error('Error during request:', error);
  }
}