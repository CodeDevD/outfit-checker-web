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
        throw new Error(`HTTP Fehler! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Antwort vom Proxy:', data);
    } catch (error) {
      console.error('Fehler bei der Anfrage:', error);
    }
  }