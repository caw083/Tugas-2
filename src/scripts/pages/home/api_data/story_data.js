import CONFIG from "../../../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`, // atau endpoint yang sesuai
};

// Fungsi untuk mengambil data stories dengan token
export async function getStoryData(token) {
  // console.log(token);
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