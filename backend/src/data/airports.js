// Airport database. Rows: [ICAO, IATA, name, city, country, lat, lon, IANA tz].
// Covers every airport in the Indian.com / Indus Air network plus major gateways, so
// any pair can be searched (partner flights fill the gaps). Admins can add more at runtime.
const ROWS = [
  // India & South Asia
  ['VOBL', 'BLR', 'Kempegowda International', 'Bengaluru', 'India', 13.1986, 77.7066, 'Asia/Kolkata'],
  ['VIDP', 'DEL', 'Indira Gandhi International', 'Delhi', 'India', 28.5562, 77.1, 'Asia/Kolkata'],
  ['VABB', 'BOM', 'Chhatrapati Shivaji Maharaj International', 'Mumbai', 'India', 19.0896, 72.8656, 'Asia/Kolkata'],
  ['VOMM', 'MAA', 'Chennai International', 'Chennai', 'India', 12.9941, 80.1709, 'Asia/Kolkata'],
  ['VOCB', 'CJB', 'Coimbatore International', 'Coimbatore', 'India', 11.03, 77.0434, 'Asia/Kolkata'],
  ['VOBI', 'VDY', 'Jindal Vijaynagar', 'Ballari', 'India', 15.1749, 76.6349, 'Asia/Kolkata'],
  ['VOHS', 'HYD', 'Rajiv Gandhi International', 'Hyderabad', 'India', 17.2403, 78.4294, 'Asia/Kolkata'],
  ['VECC', 'CCU', 'Netaji Subhas Chandra Bose International', 'Kolkata', 'India', 22.6547, 88.4467, 'Asia/Kolkata'],
  ['VOCI', 'COK', 'Cochin International', 'Kochi', 'India', 10.152, 76.4019, 'Asia/Kolkata'],
  ['VOGA', 'GOX', 'Manohar International', 'Goa', 'India', 15.7442, 73.8606, 'Asia/Kolkata'],
  ['VAAH', 'AMD', 'Sardar Vallabhbhai Patel International', 'Ahmedabad', 'India', 23.0772, 72.6347, 'Asia/Kolkata'],
  ['VAPO', 'PNQ', 'Pune International', 'Pune', 'India', 18.5821, 73.9197, 'Asia/Kolkata'],
  ['VIJP', 'JAI', 'Jaipur International', 'Jaipur', 'India', 26.8242, 75.8122, 'Asia/Kolkata'],
  ['VOTV', 'TRV', 'Thiruvananthapuram International', 'Thiruvananthapuram', 'India', 8.4821, 76.92, 'Asia/Kolkata'],
  ['VILK', 'LKO', 'Chaudhary Charan Singh International', 'Lucknow', 'India', 26.7606, 80.8893, 'Asia/Kolkata'],
  ['VILH', 'IXL', 'Kushok Bakula Rimpochee', 'Leh', 'India', 34.1359, 77.5465, 'Asia/Kolkata'],
  ['VCBI', 'CMB', 'Bandaranaike International', 'Colombo', 'Sri Lanka', 7.1808, 79.8841, 'Asia/Colombo'],
  ['VRMM', 'MLE', 'Velana International', 'Malé', 'Maldives', 4.1918, 73.5291, 'Indian/Maldives'],
  ['VNKT', 'KTM', 'Tribhuvan International', 'Kathmandu', 'Nepal', 27.6966, 85.3591, 'Asia/Kathmandu'],
  ['VQPR', 'PBH', 'Paro International', 'Paro', 'Bhutan', 27.4032, 89.4246, 'Asia/Thimphu'],
  ['OPIS', 'ISB', 'Islamabad International', 'Islamabad', 'Pakistan', 33.5491, 72.8256, 'Asia/Karachi'],
  ['OAKB', 'KBL', 'Kabul International', 'Kabul', 'Afghanistan', 34.5659, 69.2123, 'Asia/Kabul'],

  // Southeast & East Asia
  ['WSSS', 'SIN', 'Changi', 'Singapore', 'Singapore', 1.3644, 103.9915, 'Asia/Singapore'],
  ['VHHH', 'HKG', 'Hong Kong International', 'Hong Kong', 'Hong Kong SAR', 22.308, 113.9185, 'Asia/Hong_Kong'],
  ['VTBS', 'BKK', 'Suvarnabhumi', 'Bangkok', 'Thailand', 13.69, 100.7501, 'Asia/Bangkok'],
  ['WMKK', 'KUL', 'Kuala Lumpur International', 'Kuala Lumpur', 'Malaysia', 2.7456, 101.7072, 'Asia/Kuala_Lumpur'],
  ['WIII', 'CGK', 'Soekarno–Hatta International', 'Jakarta', 'Indonesia', -6.1256, 106.6559, 'Asia/Jakarta'],
  ['WADD', 'DPS', 'Ngurah Rai International', 'Bali', 'Indonesia', -8.7482, 115.1672, 'Asia/Makassar'],
  ['WBSB', 'BWN', 'Brunei International', 'Bandar Seri Begawan', 'Brunei', 4.9442, 114.9284, 'Asia/Brunei'],
  ['RPLL', 'MNL', 'Ninoy Aquino International', 'Manila', 'Philippines', 14.5086, 121.0194, 'Asia/Manila'],
  ['VVTS', 'SGN', 'Tan Son Nhat International', 'Ho Chi Minh City', 'Vietnam', 10.8188, 106.6519, 'Asia/Ho_Chi_Minh'],
  ['VDPP', 'PNH', 'Phnom Penh International', 'Phnom Penh', 'Cambodia', 11.5466, 104.844, 'Asia/Phnom_Penh'],
  ['RCTP', 'TPE', 'Taoyuan International', 'Taipei', 'Taiwan', 25.0797, 121.2342, 'Asia/Taipei'],
  ['RJTT', 'HND', 'Haneda', 'Tokyo', 'Japan', 35.5494, 139.7798, 'Asia/Tokyo'],
  ['RJAA', 'NRT', 'Narita International', 'Tokyo', 'Japan', 35.772, 140.3929, 'Asia/Tokyo'],
  ['RJEC', 'AKJ', 'Asahikawa Airport', 'Asahikawa', 'Japan', 43.6708, 142.4475, 'Asia/Tokyo'],
  ['RKSI', 'ICN', 'Incheon International', 'Seoul', 'South Korea', 37.4602, 126.4407, 'Asia/Seoul'],
  ['ZBAA', 'PEK', 'Beijing Capital International', 'Beijing', 'China', 40.0799, 116.6031, 'Asia/Shanghai'],
  ['ZSSS', 'SHA', 'Hongqiao International', 'Shanghai', 'China', 31.1979, 121.3363, 'Asia/Shanghai'],
  ['ZSPD', 'PVG', 'Pudong International', 'Shanghai', 'China', 31.1443, 121.8083, 'Asia/Shanghai'],
  ['ZGSZ', 'SZX', "Bao'an International", 'Shenzhen', 'China', 22.6393, 113.8107, 'Asia/Shanghai'],
  ['ZMUB', 'ULN', 'Buyant-Ukhaa International', 'Ulaanbaatar', 'Mongolia', 47.8431, 106.7666, 'Asia/Ulaanbaatar'],

  // Middle East & Central Asia
  ['OMDB', 'DXB', 'Dubai International', 'Dubai', 'United Arab Emirates', 25.2532, 55.3657, 'Asia/Dubai'],
  ['OMAA', 'AUH', 'Zayed International', 'Abu Dhabi', 'United Arab Emirates', 24.433, 54.6511, 'Asia/Dubai'],
  ['OMSJ', 'SHJ', 'Sharjah International', 'Sharjah', 'United Arab Emirates', 25.3286, 55.5172, 'Asia/Dubai'],
  ['OMRK', 'RKT', 'Ras Al Khaimah International', 'Ras Al Khaimah', 'United Arab Emirates', 25.6135, 55.9388, 'Asia/Dubai'],
  ['OOMS', 'MCT', 'Muscat International', 'Muscat', 'Oman', 23.5933, 58.2844, 'Asia/Muscat'],
  ['OBBI', 'BAH', 'Bahrain International', 'Manama', 'Bahrain', 26.2708, 50.6336, 'Asia/Bahrain'],
  ['OKBK', 'KWI', 'Kuwait International', 'Kuwait City', 'Kuwait', 29.2266, 47.9689, 'Asia/Kuwait'],
  ['OERK', 'RUH', 'King Khalid International', 'Riyadh', 'Saudi Arabia', 24.9576, 46.6988, 'Asia/Riyadh'],
  ['OEJN', 'JED', 'King Abdulaziz International', 'Jeddah', 'Saudi Arabia', 21.6796, 39.1565, 'Asia/Riyadh'],
  ['OLBA', 'BEY', 'Rafic Hariri International', 'Beirut', 'Lebanon', 33.8209, 35.4884, 'Asia/Beirut'],
  ['UDYZ', 'EVN', 'Zvartnots International', 'Yerevan', 'Armenia', 40.1473, 44.3959, 'Asia/Yerevan'],

  // Africa & Indian Ocean
  ['HECA', 'CAI', 'Cairo International', 'Cairo', 'Egypt', 30.1219, 31.4056, 'Africa/Cairo'],
  ['HAAB', 'ADD', 'Bole International', 'Addis Ababa', 'Ethiopia', 8.9779, 38.7993, 'Africa/Addis_Ababa'],
  ['HDAM', 'JIB', 'Djibouti–Ambouli International', 'Djibouti', 'Djibouti', 11.5473, 43.1595, 'Africa/Djibouti'],
  ['HKJK', 'NBO', 'Jomo Kenyatta International', 'Nairobi', 'Kenya', -1.3192, 36.9278, 'Africa/Nairobi'],
  ['FAOR', 'JNB', 'O. R. Tambo International', 'Johannesburg', 'South Africa', -26.1392, 28.246, 'Africa/Johannesburg'],
  ['FAGM', 'QRA', 'Rand Airport', 'Johannesburg (Germiston)', 'South Africa', -26.2425, 28.1512, 'Africa/Johannesburg'],
  ['FACT', 'CPT', 'Cape Town International', 'Cape Town', 'South Africa', -33.9715, 18.6021, 'Africa/Johannesburg'],
  ['FWKI', 'LLW', 'Kamuzu International', 'Lilongwe', 'Malawi', -13.7894, 33.781, 'Africa/Blantyre'],
  ['FMMI', 'TNR', 'Ivato International', 'Antananarivo', 'Madagascar', -18.7969, 47.4788, 'Indian/Antananarivo'],
  ['FMEE', 'RUN', 'Roland Garros', 'Saint-Denis', 'Réunion', -20.8871, 55.5103, 'Indian/Reunion'],
  ['FIMP', 'MRU', 'Sir Seewoosagur Ramgoolam International', 'Mauritius', 'Mauritius', -20.4302, 57.6836, 'Indian/Mauritius'],
  ['FSIA', 'SEZ', 'Seychelles International', 'Mahé', 'Seychelles', -4.6743, 55.5218, 'Indian/Mahe'],
  ['FCBB', 'BZV', 'Maya-Maya', 'Brazzaville', 'Republic of the Congo', -4.2517, 15.253, 'Africa/Brazzaville'],
  ['DFFD', 'OUA', 'Thomas Sankara International', 'Ouagadougou', 'Burkina Faso', 12.3532, -1.5124, 'Africa/Ouagadougou'],
  ['DISP', 'SPY', 'San-Pédro Airport', 'San-Pédro', "Côte d'Ivoire", 4.7467, -6.6608, 'Africa/Abidjan'],
  ['DAAS', 'QSF', 'Ain Arnat', 'Sétif', 'Algeria', 36.1781, 5.3245, 'Africa/Algiers'],
  ['GLRB', 'ROB', 'Roberts International', 'Monrovia', 'Liberia', 6.2338, -10.3623, 'Africa/Monrovia'],
  ['GVAC', 'SID', 'Amílcar Cabral International', 'Sal', 'Cape Verde', 16.7414, -22.9494, 'Atlantic/Cape_Verde'],

  // Europe
  ['LIRF', 'FCO', 'Leonardo da Vinci–Fiumicino', 'Rome', 'Italy', 41.8003, 12.2389, 'Europe/Rome'],
  ['LIPZ', 'VCE', 'Marco Polo', 'Venice', 'Italy', 45.5053, 12.3519, 'Europe/Rome'],
  ['EGLL', 'LHR', 'Heathrow', 'London', 'United Kingdom', 51.47, -0.4543, 'Europe/London'],
  ['LFPG', 'CDG', 'Charles de Gaulle', 'Paris', 'France', 49.0097, 2.5479, 'Europe/Paris'],
  ['EDDF', 'FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany', 50.0379, 8.5622, 'Europe/Berlin'],
  ['EHAM', 'AMS', 'Schiphol', 'Amsterdam', 'Netherlands', 52.3105, 4.7683, 'Europe/Amsterdam'],
  ['EBBR', 'BRU', 'Brussels Airport', 'Brussels', 'Belgium', 50.901, 4.4844, 'Europe/Brussels'],
  ['EKCH', 'CPH', 'Copenhagen Airport', 'Copenhagen', 'Denmark', 55.618, 12.656, 'Europe/Copenhagen'],
  ['LOWW', 'VIE', 'Vienna International', 'Vienna', 'Austria', 48.1103, 16.5697, 'Europe/Vienna'],
  ['LSZH', 'ZRH', 'Zürich Airport', 'Zürich', 'Switzerland', 47.4582, 8.5555, 'Europe/Zurich'],
  ['LEMD', 'MAD', 'Adolfo Suárez Madrid–Barajas', 'Madrid', 'Spain', 40.4983, -3.5676, 'Europe/Madrid'],
  ['LEBL', 'BCN', 'Josep Tarradellas Barcelona–El Prat', 'Barcelona', 'Spain', 41.2974, 2.0833, 'Europe/Madrid'],
  ['LGAV', 'ATH', 'Athens International', 'Athens', 'Greece', 37.9364, 23.9445, 'Europe/Athens'],
  ['LATI', 'TIA', 'Tirana International', 'Tirana', 'Albania', 41.4147, 19.7206, 'Europe/Tirane'],
  ['LRBS', 'BBU', 'Aurel Vlaicu (Băneasa)', 'Bucharest', 'Romania', 44.5032, 26.1021, 'Europe/Bucharest'],
  ['LTBA', 'ISL', 'Atatürk Airport', 'Istanbul', 'Türkiye', 40.9769, 28.8146, 'Europe/Istanbul'],
  ['LTFM', 'IST', 'Istanbul Airport', 'Istanbul', 'Türkiye', 41.2753, 28.7519, 'Europe/Istanbul'],
  ['UUEE', 'SVO', 'Sheremetyevo International', 'Moscow', 'Russia', 55.9726, 37.4146, 'Europe/Moscow'],
  ['BIKF', 'KEF', 'Keflavík International', 'Reykjavík', 'Iceland', 63.985, -22.6056, 'Atlantic/Reykjavik'],

  // Oceania & Pacific
  ['YSSY', 'SYD', 'Kingsford Smith', 'Sydney', 'Australia', -33.9399, 151.1753, 'Australia/Sydney'],
  ['YMML', 'MEL', 'Melbourne Airport', 'Melbourne', 'Australia', -37.669, 144.841, 'Australia/Melbourne'],
  ['YBBN', 'BNE', 'Brisbane Airport', 'Brisbane', 'Australia', -27.3842, 153.1175, 'Australia/Brisbane'],
  ['YPPH', 'PER', 'Perth Airport', 'Perth', 'Australia', -31.9385, 115.9672, 'Australia/Perth'],
  ['YPAD', 'ADL', 'Adelaide Airport', 'Adelaide', 'Australia', -34.945, 138.5306, 'Australia/Adelaide'],
  ['YSCB', 'CBR', 'Canberra Airport', 'Canberra', 'Australia', -35.3069, 149.195, 'Australia/Sydney'],
  ['YBCS', 'CNS', 'Cairns Airport', 'Cairns', 'Australia', -16.8858, 145.7552, 'Australia/Brisbane'],
  ['NZAA', 'AKL', 'Auckland Airport', 'Auckland', 'New Zealand', -37.0082, 174.785, 'Pacific/Auckland'],
  ['NZCH', 'CHC', 'Christchurch International', 'Christchurch', 'New Zealand', -43.4894, 172.5322, 'Pacific/Auckland'],
  ['NZQN', 'ZQN', 'Queenstown Airport', 'Queenstown', 'New Zealand', -45.0211, 168.7392, 'Pacific/Auckland'],
  ['NZWN', 'WLG', 'Wellington International', 'Wellington', 'New Zealand', -41.3272, 174.8053, 'Pacific/Auckland'],
  ['NFFN', 'NAN', 'Nadi International', 'Nadi', 'Fiji', -17.7554, 177.4434, 'Pacific/Fiji'],
  ['NWWW', 'NOU', 'La Tontouta International', 'Nouméa', 'New Caledonia', -22.0146, 166.2129, 'Pacific/Noumea'],
  ['NLWW', 'WLS', 'Hihifo Airport', 'Wallis Island', 'Wallis and Futuna', -13.2383, -176.1992, 'Pacific/Wallis'],
  ['NSTU', 'PPG', 'Pago Pago International', 'Pago Pago', 'American Samoa', -14.331, -170.7105, 'Pacific/Pago_Pago'],
  ['NTAA', 'PPT', "Fa'a'ā International", 'Papeete', 'French Polynesia', -17.5537, -149.6067, 'Pacific/Tahiti'],
  ['ANYN', 'INU', 'Nauru International', 'Yaren', 'Nauru', -0.5472, 166.9191, 'Pacific/Nauru'],
  ['AYPY', 'POM', 'Jacksons International', 'Port Moresby', 'Papua New Guinea', -9.4434, 147.22, 'Pacific/Port_Moresby'],
  ['PHNL', 'HNL', 'Daniel K. Inouye International', 'Honolulu', 'United States', 21.3187, -157.9225, 'Pacific/Honolulu'],

  // North America
  ['KSFO', 'SFO', 'San Francisco International', 'San Francisco', 'United States', 37.6213, -122.379, 'America/Los_Angeles'],
  ['KLAX', 'LAX', 'Los Angeles International', 'Los Angeles', 'United States', 33.9416, -118.4085, 'America/Los_Angeles'],
  ['KSEA', 'SEA', 'Seattle–Tacoma International', 'Seattle', 'United States', 47.4502, -122.3088, 'America/Los_Angeles'],
  ['KLAS', 'LAS', 'Harry Reid International', 'Las Vegas', 'United States', 36.084, -115.1537, 'America/Los_Angeles'],
  ['KPHX', 'PHX', 'Phoenix Sky Harbor International', 'Phoenix', 'United States', 33.4352, -112.0101, 'America/Phoenix'],
  ['KDEN', 'DEN', 'Denver International', 'Denver', 'United States', 39.8561, -104.6737, 'America/Denver'],
  ['KDFW', 'DFW', 'Dallas Fort Worth International', 'Dallas', 'United States', 32.8998, -97.0403, 'America/Chicago'],
  ['KIAH', 'IAH', 'George Bush Intercontinental', 'Houston', 'United States', 29.9902, -95.3368, 'America/Chicago'],
  ['KMCI', 'MCI', 'Kansas City International', 'Kansas City', 'United States', 39.2976, -94.7139, 'America/Chicago'],
  ['KORD', 'ORD', "O'Hare International", 'Chicago', 'United States', 41.9742, -87.9073, 'America/Chicago'],
  ['KATL', 'ATL', 'Hartsfield–Jackson Atlanta International', 'Atlanta', 'United States', 33.6407, -84.4277, 'America/New_York'],
  ['KIAD', 'IAD', 'Washington Dulles International', 'Washington, D.C.', 'United States', 38.9531, -77.4565, 'America/New_York'],
  ['KJFK', 'JFK', 'John F. Kennedy International', 'New York', 'United States', 40.6413, -73.7781, 'America/New_York'],
  ['KEWR', 'EWR', 'Newark Liberty International', 'Newark', 'United States', 40.6895, -74.1745, 'America/New_York'],
  ['KBOS', 'BOS', 'Logan International', 'Boston', 'United States', 42.3656, -71.0096, 'America/New_York'],
  ['PANC', 'ANC', 'Ted Stevens Anchorage International', 'Anchorage', 'United States', 61.1743, -149.9963, 'America/Anchorage'],
  ['CYYZ', 'YYZ', 'Toronto Pearson International', 'Toronto', 'Canada', 43.6777, -79.6248, 'America/Toronto'],
  ['CYYC', 'YYC', 'Calgary International', 'Calgary', 'Canada', 51.1215, -114.0076, 'America/Edmonton'],
  ['CYVR', 'YVR', 'Vancouver International', 'Vancouver', 'Canada', 49.1967, -123.1815, 'America/Vancouver'],
  ['MMMX', 'MEX', 'Benito Juárez International', 'Mexico City', 'Mexico', 19.4361, -99.0719, 'America/Mexico_City'],

  // Central America & Caribbean
  ['MGGT', 'GUA', 'La Aurora International', 'Guatemala City', 'Guatemala', 14.5833, -90.5275, 'America/Guatemala'],
  ['MHTG', 'TGU', 'Toncontín International', 'Tegucigalpa', 'Honduras', 14.0609, -87.2172, 'America/Tegucigalpa'],
  ['MROC', 'SJO', 'Juan Santamaría International', 'San José', 'Costa Rica', 9.9939, -84.2088, 'America/Costa_Rica'],
  ['MUHA', 'HAV', 'José Martí International', 'Havana', 'Cuba', 22.9892, -82.4091, 'America/Havana'],
  ['MYNN', 'NAS', 'Lynden Pindling International', 'Nassau', 'Bahamas', 25.039, -77.4662, 'America/Nassau'],
  ['TAPA', 'ANU', 'V. C. Bird International', "St. John's", 'Antigua and Barbuda', 17.1367, -61.7927, 'America/Antigua'],
  ['TBPB', 'BGI', 'Grantley Adams International', 'Bridgetown', 'Barbados', 13.0746, -59.4925, 'America/Barbados'],
  ['TDPD', 'DOM', 'Douglas–Charles Airport', 'Marigot', 'Dominica', 15.547, -61.3, 'America/Dominica'],
  ['TGPY', 'GND', 'Maurice Bishop International', "St. George's", 'Grenada', 12.0042, -61.7862, 'America/Grenada'],
  ['TNCA', 'AUA', 'Queen Beatrix International', 'Oranjestad', 'Aruba', 12.5014, -70.0152, 'America/Aruba'],
  ['TNCC', 'CUR', 'Curaçao International', 'Willemstad', 'Curaçao', 12.1889, -68.9598, 'America/Curacao'],
  ['TNCM', 'SXM', 'Princess Juliana International', 'Sint Maarten', 'Sint Maarten', 18.041, -63.1089, 'America/Lower_Princes'],
  ['TTPP', 'POS', 'Piarco International', 'Port of Spain', 'Trinidad and Tobago', 10.5954, -61.3372, 'America/Port_of_Spain'],
  ['TUPJ', 'EIS', 'Terrance B. Lettsome International', 'Tortola', 'British Virgin Islands', 18.4448, -64.5430, 'America/Tortola'],

  // South America & South Atlantic
  ['SKBO', 'BOG', 'El Dorado International', 'Bogotá', 'Colombia', 4.7016, -74.1469, 'America/Bogota'],
  ['SEQM', 'UIO', 'Mariscal Sucre International', 'Quito', 'Ecuador', -0.1292, -78.3575, 'America/Guayaquil'],
  ['SPIM', 'LIM', 'Jorge Chávez International', 'Lima', 'Peru', -12.0219, -77.1143, 'America/Lima'],
  ['SLLP', 'LPB', 'El Alto International', 'La Paz', 'Bolivia', -16.5133, -68.1923, 'America/La_Paz'],
  ['SVMI', 'CCS', 'Simón Bolívar International', 'Caracas', 'Venezuela', 10.6031, -66.9906, 'America/Caracas'],
  ['SMJP', 'PBM', 'Johan Adolf Pengel International', 'Paramaribo', 'Suriname', 5.4528, -55.1878, 'America/Paramaribo'],
  ['SBBR', 'BSB', 'Presidente Juscelino Kubitschek International', 'Brasília', 'Brazil', -15.8711, -47.9186, 'America/Sao_Paulo'],
  ['SBGR', 'GRU', 'São Paulo–Guarulhos International', 'São Paulo', 'Brazil', -23.4356, -46.4731, 'America/Sao_Paulo'],
  ['SBGL', 'GIG', 'Rio de Janeiro–Galeão International', 'Rio de Janeiro', 'Brazil', -22.809, -43.2506, 'America/Sao_Paulo'],
  ['SAEZ', 'EZE', 'Ministro Pistarini International', 'Buenos Aires', 'Argentina', -34.8222, -58.5358, 'America/Argentina/Buenos_Aires'],
  ['SCEL', 'SCL', 'Arturo Merino Benítez International', 'Santiago', 'Chile', -33.393, -70.7858, 'America/Santiago'],
  ['SFAL', 'PSY', 'Port Stanley Airport', 'Stanley', 'Falkland Islands', -51.6857, -57.7776, 'Atlantic/Stanley'],
  ['EGYP', 'MPN', 'RAF Mount Pleasant', 'Mount Pleasant', 'Falkland Islands', -51.8228, -58.4472, 'Atlantic/Stanley'],
];

/** Primary hub first, then the secondary hubs. */
export const HUBS = { VOBL: 'primary', VIDP: 'secondary', OMDB: 'secondary', WSSS: 'secondary', VHHH: 'secondary', YSSY: 'secondary', NZAA: 'secondary', LIRF: 'secondary', KSFO: 'secondary' };

export function airportFromRow([icao, code, name, city, country, lat, lon, tz]) {
  return { icao, code, name, city, country, lat, lon, tz, ...(HUBS[icao] && { hub: HUBS[icao] }) };
}

export const BASE_AIRPORTS = ROWS.map(airportFromRow);

/** Coarse region, used to pick which alliance partner runs a fallback flight. */
export function regionOf(airport) {
  const tz = airport.tz;
  if (airport.country === 'United States' && tz === 'Pacific/Honolulu') return 'oceania';
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return 'oceania';
  if (tz.startsWith('America/') || tz === 'Atlantic/Stanley') return 'americas';
  if (tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik') return 'europe';
  if (tz.startsWith('Africa/') || tz.startsWith('Indian/') && airport.country !== 'Maldives' || tz === 'Atlantic/Cape_Verde') return 'africa';
  return 'asia';
}
