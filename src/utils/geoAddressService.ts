/**
 * Geo Address & Reverse Geocoding Service
 * Menyediakan konversi titik koordinat GPS (latitude, longitude) menjadi
 * alamat jalan, kelurahan, dan lokasi riil yang akurat di Kepulauan Seribu Selatan dan DKI Jakarta.
 */

interface AddressCacheItem {
  address: string;
  timestamp: number;
}

const addressCache = new Map<string, AddressCacheItem>();

// Database titik wilayah terdaftar di Kepulauan Seribu Selatan
const KNOWN_LOCATIONS = [
  {
    name: 'Puskesmas Kecamatan Kepulauan Seribu Selatan',
    street: 'Jl. Raya Pulau Tidung RT 02/RW 02',
    kelurahan: 'Kel. Pulau Tidung',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'Kab. Adm. Kepulauan Seribu, DKI Jakarta 14520',
    lat: -5.7998,
    lng: 106.5235,
    radius: 0.015 // ~1.5km
  },
  {
    name: 'Wilayah Dermaga & Pesisir Barat Pulau Tidung',
    street: 'Jl. Dermaga Pelabuhan Utama Pulau Tidung RT 01/RW 02',
    kelurahan: 'Kel. Pulau Tidung',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'DKI Jakarta 14520',
    lat: -5.8015,
    lng: 106.528,
    radius: 0.012
  },
  {
    name: 'Wilayah Jembatan Cinta & Pesisir Timur Pulau Tidung',
    street: 'Jl. Pantai Jembatan Cinta RT 04/RW 01',
    kelurahan: 'Kel. Pulau Tidung',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'DKI Jakarta 14520',
    lat: -5.8032,
    lng: 106.5312,
    radius: 0.015
  },
  {
    name: 'Puskesmas Pembantu (Pustu) Untung Jawa',
    street: 'Jl. Bougenville No. 04 RT 01/RW 01',
    kelurahan: 'Kel. Pulau Untung Jawa',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'Kab. Adm. Kepulauan Seribu, DKI Jakarta 14510',
    lat: -5.9782,
    lng: 106.7042,
    radius: 0.015
  },
  {
    name: 'Dermaga Penyeberangan Pulau Untung Jawa',
    street: 'Jl. Dermaga Utama Wisata Bahari RT 02/RW 02',
    kelurahan: 'Kel. Pulau Untung Jawa',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'DKI Jakarta 14510',
    lat: -5.9765,
    lng: 106.7028,
    radius: 0.012
  },
  {
    name: 'Puskesmas Pembantu (Pustu) Pulau Pari',
    street: 'Jl. Pantai Pasir Perawan RT 01/RW 04',
    kelurahan: 'Kel. Pulau Pari',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'DKI Jakarta 14520',
    lat: -5.8601,
    lng: 106.6186,
    radius: 0.015
  },
  {
    name: 'Puskesmas Pembantu (Pustu) Pulau Lancang',
    street: 'Jl. Nelayan Bahari RT 02/RW 03, Pulau Lancang',
    kelurahan: 'Kel. Pulau Pari',
    kecamatan: 'Kec. Kepulauan Seribu Selatan',
    city: 'Kab. Adm. Kepulauan Seribu, DKI Jakarta 14520',
    lat: -5.9221,
    lng: 106.5872,
    radius: 0.015
  },
  {
    name: 'Kantor Transit Jakarta / Marina Ancol',
    street: 'Dermaga 16-17 Marina Ancol, Jl. Lodan Timur No. 7',
    kelurahan: 'Kel. Ancol, Kec. Pademangan',
    kecamatan: 'Jakarta Utara',
    city: 'DKI Jakarta 14430',
    lat: -6.1245,
    lng: 106.8317,
    radius: 0.03
  }
];

/**
 * Mencari alamat lokal terdekat berdasarkan koordinat GPS
 */
export function getLocalFallbackAddress(lat: number, lng: number): string {
  let closest = KNOWN_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of KNOWN_LOCATIONS) {
    const dLat = loc.lat - lat;
    const dLng = loc.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  // Jika masih dalam radius wilayah pulau terdekat
  if (minDistance <= closest.radius * 2.5) {
    return `${closest.street}, ${closest.kelurahan}, ${closest.kecamatan}`;
  }

  // Umum Kepulauan Seribu Selatan jika di laut / perairan
  if (lat > -6.05 && lat < -5.7) {
    return `Wilayah Perairan Gugus Pulau, Kec. Kepulauan Seribu Selatan, DKI Jakarta`;
  }

  // Umum Daratan Jakarta
  return `Wilayah DKI Jakarta (Koordinat GPS Terdeteksi: ${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

/**
 * Dapatkan alamat lengkap jalan dan lokasi secara asinkron
 * Mendukung online reverse geocode dengan fallback lokal instan
 */
export async function resolveStreetAddress(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = addressCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) {
    return cached.address;
  }

  // Default fallback jika geocoding online lambat atau gagal
  const localFallback = getLocalFallbackAddress(lat, lng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'id,en',
          'User-Agent': 'SINAKHODA-HealthMonitoring/3.0'
        }
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
        const village = addr.village || addr.suburb || addr.quarter || addr.city_district || '';
        const county = addr.county || addr.city || 'Kepulauan Seribu Selatan';
        const state = addr.state || 'DKI Jakarta';

        let formatted = '';
        if (road) formatted += `${road}, `;
        if (village) formatted += `${village}, `;
        if (county) formatted += `${county}, `;
        formatted += state;

        if (formatted.length > 10) {
          addressCache.set(cacheKey, { address: formatted, timestamp: Date.now() });
          return formatted;
        }
      }
    }
  } catch (e) {
    // Online reverse geocoding fallback
  }

  addressCache.set(cacheKey, { address: localFallback, timestamp: Date.now() });
  return localFallback;
}
