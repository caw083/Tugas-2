import CONFIG from '../config';
import { tokenService } from '../utils/tokenService/tokenService';
const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`, // atau endpoint yang sesuai
  SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

// Fungsi untuk mengambil data stories dengan token
export async function getStoryData(token) {
  console.log(token);
  try {
    const fetchResponse = await fetch(ENDPOINTS.STORIES, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    return await fetchResponse.json();
  } catch (error) {
    console.error('Error fetching story data:', error);
    throw error;
  }
}

export async function subscribePushNotification({ endpoint, keys: { p256dh, auth } }) {
  const accessToken = tokenService.getToken();
  const data = JSON.stringify({
    endpoint,
    keys: { p256dh, auth },
  });

  const fetchResponse = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function unsubscribePushNotification({ endpoint }) {
  const accessToken =  tokenService.getToken();
  const data = JSON.stringify({ endpoint });

  const fetchResponse = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}
