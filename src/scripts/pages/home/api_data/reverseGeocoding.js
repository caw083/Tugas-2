import CONFIG from "../../../config";

// Fungsi untuk mengambil data reverse geocoding dari MapTiler API
export async function getReverseGeocode(longitude, latitude) {  
  try {
    const url = `${CONFIG.MAP_TILLER_URL}/${longitude},${latitude}.json?key=${CONFIG.MAP_TILLER_API_KEY}`;
    
    const fetchResponse = await fetch(url, {
      method: 'GET'
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    return await fetchResponse.json();
  } catch (error) {
    console.error('Error fetching reverse geocode data:', error);
    throw error;
  }
}

// Fungsi untuk mengambil nama kota dari koordinat
export async function getCityofGeocode(longitude, latitude) {  
  try {
    const geocodeData = await getReverseGeocode(longitude, latitude);
    
    // MapTiler API mengembalikan data dalam format features array
    if (geocodeData && geocodeData.features && geocodeData.features.length > 0) {
      const features = geocodeData.features;
      
      // Prioritas pencarian berdasarkan place_type:
      // 1. Cari 'subregion' (Jakarta Pusat, dll)
      let cityFeature = features.find(feature => 
        feature.place_type && feature.place_type.includes('subregion')
      );
      
      // 2. Jika tidak ada subregion, cari 'place'
      if (!cityFeature) {
        cityFeature = features.find(feature => 
          feature.place_type && feature.place_type.includes('place')
        );
      }
      
      // 3. Jika tidak ada place, cari yang memiliki osm:place_type 'city'
      if (!cityFeature) {
        cityFeature = features.find(feature => 
          feature.properties && 
          feature.properties['osm:place_type'] === 'city'
        );
      }
      
      // 4. Jika tidak ada, cari 'municipal_district'
      if (!cityFeature) {
        cityFeature = features.find(feature => 
          feature.place_type && feature.place_type.includes('municipal_district')
        );
      }
      
      // Kembalikan nama kota yang ditemukan
      if (cityFeature) {
        return cityFeature.text || cityFeature.place_name;
      }
      
      // Jika tidak ada yang sesuai, ambil feature pertama
      return features[0].text || features[0].place_name || 'Unknown location';
    }
    
    return 'Location not found';
  } catch (error) {
    console.error('Error getting city name:', error);
    throw error;
  }
}