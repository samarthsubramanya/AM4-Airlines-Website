// Airports served by Indian.com. `hub` is "primary", "secondary" or undefined.
export const AIRPORTS = [
  // Hubs
  { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'India', lat: 13.1986, lon: 77.7066, tz: 'Asia/Kolkata', hub: 'primary' },
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India', lat: 28.5562, lon: 77.1, tz: 'Asia/Kolkata', hub: 'secondary' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lon: 55.3657, tz: 'Asia/Dubai', hub: 'secondary' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915, tz: 'Asia/Singapore', hub: 'secondary' },
  { code: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'Hong Kong SAR', lat: 22.308, lon: 113.9185, tz: 'Asia/Hong_Kong', hub: 'secondary' },
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753, tz: 'Australia/Sydney', hub: 'secondary' },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lon: 174.785, tz: 'Pacific/Auckland', hub: 'secondary' },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389, tz: 'Europe/Rome', hub: 'secondary' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'United States', lat: 37.6213, lon: -122.379, tz: 'America/Los_Angeles', hub: 'secondary' },

  // India
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', lat: 19.0896, lon: 72.8656, tz: 'Asia/Kolkata' },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India', lat: 12.9941, lon: 80.1709, tz: 'Asia/Kolkata' },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India', lat: 17.2403, lon: 78.4294, tz: 'Asia/Kolkata' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India', lat: 22.6547, lon: 88.4467, tz: 'Asia/Kolkata' },
  { code: 'COK', name: 'Cochin International', city: 'Kochi', country: 'India', lat: 10.152, lon: 76.4019, tz: 'Asia/Kolkata' },
  { code: 'GOI', name: 'Manohar International', city: 'Goa', country: 'India', lat: 15.7309, lon: 73.8655, tz: 'Asia/Kolkata' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', lat: 23.0772, lon: 72.6347, tz: 'Asia/Kolkata' },
  { code: 'PNQ', name: 'Pune International', city: 'Pune', country: 'India', lat: 18.5821, lon: 73.9197, tz: 'Asia/Kolkata' },
  { code: 'JAI', name: 'Jaipur International', city: 'Jaipur', country: 'India', lat: 26.8242, lon: 75.8122, tz: 'Asia/Kolkata' },
  { code: 'TRV', name: 'Thiruvananthapuram International', city: 'Thiruvananthapuram', country: 'India', lat: 8.4821, lon: 76.92, tz: 'Asia/Kolkata' },
  { code: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', country: 'India', lat: 26.7606, lon: 80.8893, tz: 'Asia/Kolkata' },
  { code: 'IXL', name: 'Kushok Bakula Rimpochee', city: 'Leh', country: 'India', lat: 34.1359, lon: 77.5465, tz: 'Asia/Kolkata' },

  // South & Southeast Asia
  { code: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lon: 79.8841, tz: 'Asia/Colombo' },
  { code: 'MLE', name: 'Velana International', city: 'Malé', country: 'Maldives', lat: 4.1918, lon: 73.5291, tz: 'Indian/Maldives' },
  { code: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lon: 85.3591, tz: 'Asia/Kathmandu' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.69, lon: 100.7501, tz: 'Asia/Bangkok' },
  { code: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lon: 101.7072, tz: 'Asia/Kuala_Lumpur' },
  { code: 'CGK', name: 'Soekarno–Hatta International', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lon: 106.6559, tz: 'Asia/Jakarta' },
  { code: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia', lat: -8.7482, lon: 115.1672, tz: 'Asia/Makassar' },
  { code: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines', lat: 14.5086, lon: 121.0194, tz: 'Asia/Manila' },
  { code: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8188, lon: 106.6519, tz: 'Asia/Ho_Chi_Minh' },

  // East Asia
  { code: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan', lat: 35.772, lon: 140.3929, tz: 'Asia/Tokyo' },
  { code: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea', lat: 37.4602, lon: 126.4407, tz: 'Asia/Seoul' },
  { code: 'TPE', name: 'Taoyuan International', city: 'Taipei', country: 'Taiwan', lat: 25.0797, lon: 121.2342, tz: 'Asia/Taipei' },
  { code: 'PVG', name: 'Pudong International', city: 'Shanghai', country: 'China', lat: 31.1443, lon: 121.8083, tz: 'Asia/Shanghai' },

  // Middle East & Africa
  { code: 'MCT', name: 'Muscat International', city: 'Muscat', country: 'Oman', lat: 23.5933, lon: 58.2844, tz: 'Asia/Muscat' },
  { code: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lon: 39.1565, tz: 'Asia/Riyadh' },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', lat: 30.1219, lon: 31.4056, tz: 'Africa/Cairo' },
  { code: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lon: 36.9278, tz: 'Africa/Nairobi' },
  { code: 'JNB', name: 'O. R. Tambo International', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lon: 28.246, tz: 'Africa/Johannesburg' },
  { code: 'MRU', name: 'Sir Seewoosagur Ramgoolam International', city: 'Mauritius', country: 'Mauritius', lat: -20.4302, lon: 57.6836, tz: 'Indian/Mauritius' },

  // Europe
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom', lat: 51.47, lon: -0.4543, tz: 'Europe/London' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479, tz: 'Europe/Paris' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622, tz: 'Europe/Berlin' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683, tz: 'Europe/Amsterdam' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lon: -3.5676, tz: 'Europe/Madrid' },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona–El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833, tz: 'Europe/Madrid' },
  { code: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9445, tz: 'Europe/Athens' },
  { code: 'ZRH', name: 'Zürich Airport', city: 'Zürich', country: 'Switzerland', lat: 47.4582, lon: 8.5555, tz: 'Europe/Zurich' },
  { code: 'VCE', name: 'Marco Polo', city: 'Venice', country: 'Italy', lat: 45.5053, lon: 12.3519, tz: 'Europe/Rome' },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Türkiye', lat: 41.2753, lon: 28.7519, tz: 'Europe/Istanbul' },

  // Oceania
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.669, lon: 144.841, tz: 'Australia/Melbourne' },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lon: 153.1175, tz: 'Australia/Brisbane' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9385, lon: 115.9672, tz: 'Australia/Perth' },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia', lat: -34.945, lon: 138.5306, tz: 'Australia/Adelaide' },
  { code: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australia', lat: -16.8858, lon: 145.7552, tz: 'Australia/Brisbane' },
  { code: 'CHC', name: 'Christchurch International', city: 'Christchurch', country: 'New Zealand', lat: -43.4894, lon: 172.5322, tz: 'Pacific/Auckland' },
  { code: 'ZQN', name: 'Queenstown Airport', city: 'Queenstown', country: 'New Zealand', lat: -45.0211, lon: 168.7392, tz: 'Pacific/Auckland' },
  { code: 'WLG', name: 'Wellington International', city: 'Wellington', country: 'New Zealand', lat: -41.3272, lon: 174.8053, tz: 'Pacific/Auckland' },
  { code: 'NAN', name: 'Nadi International', city: 'Nadi', country: 'Fiji', lat: -17.7554, lon: 177.4434, tz: 'Pacific/Fiji' },
  { code: 'PPT', name: "Fa'a'ā International", city: 'Papeete', country: 'French Polynesia', lat: -17.5537, lon: -149.6067, tz: 'Pacific/Tahiti' },

  // Americas
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'United States', lat: 33.9416, lon: -118.4085, tz: 'America/Los_Angeles' },
  { code: 'SEA', name: 'Seattle–Tacoma International', city: 'Seattle', country: 'United States', lat: 47.4502, lon: -122.3088, tz: 'America/Los_Angeles' },
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'United States', lat: 40.6413, lon: -73.7781, tz: 'America/New_York' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'United States', lat: 41.9742, lon: -87.9073, tz: 'America/Chicago' },
  { code: 'DFW', name: 'Dallas Fort Worth International', city: 'Dallas', country: 'United States', lat: 32.8998, lon: -97.0403, tz: 'America/Chicago' },
  { code: 'BOS', name: 'Logan International', city: 'Boston', country: 'United States', lat: 42.3656, lon: -71.0096, tz: 'America/New_York' },
  { code: 'HNL', name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'United States', lat: 21.3187, lon: -157.9225, tz: 'Pacific/Honolulu' },
  { code: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1967, lon: -123.1815, tz: 'America/Vancouver' },
  { code: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248, tz: 'America/Toronto' },
  { code: 'MEX', name: 'Benito Juárez International', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719, tz: 'America/Mexico_City' },
  { code: 'SCL', name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'Chile', lat: -33.393, lon: -70.7858, tz: 'America/Santiago' },
];

export const AIRPORT_BY_CODE = Object.fromEntries(AIRPORTS.map((a) => [a.code, a]));
export const HUB_CODES = AIRPORTS.filter((a) => a.hub).map((a) => a.code);
