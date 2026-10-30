export type Cabin = "economy" | "business" | "first";

export interface Airport {
  code: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
  hub?: "primary" | "secondary";
}

export type AirlineCode = "IN" | "IS" | "QS" | "GR" | "RB";

export interface Airline {
  code: AirlineCode;
  name: string;
  kind: "own" | "partner";
  color: string;
  accent: string;
  tagline: string;
}

export interface Leg {
  key: string;
  flightNo: string;
  operator: AirlineCode;
  partner: boolean;
  routeId: string | null;
  aircraftName: string;
  registration: string | null;
  date: string;
  from: string;
  to: string;
  depUtc: number;
  arrUtc: number;
  durationMin: number;
  km: number;
  aircraft: string;
}

export interface Price {
  currency: string;
  perAdult: number;
  perChild: number;
  base: number;
  taxes: number;
  total: number;
}

export interface CabinOffer {
  seatsLeft: number;
  available: boolean;
  price: Price;
}

export interface Itinerary {
  id: string;
  legs: Leg[];
  stops: number;
  depUtc: number;
  arrUtc: number;
  durationMin: number;
  km: number;
  operators: AirlineCode[];
  codeshare: boolean;
  cabins: Partial<Record<Cabin, CabinOffer>>;
}

export interface SearchQuery {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  cabin: Cabin;
}

export interface SeatLayout {
  rows: [number, number];
  blocks: string[][];
}

export interface SeatMapData {
  flight: Leg;
  aircraft: { code: string; name: string; category: string };
  cabin: Cabin;
  layout: SeatLayout;
  occupied: string[];
  extraLegroom: string[];
}

export interface PassengerInput {
  type: "adult" | "child";
  title?: string;
  firstName: string;
  lastName: string;
  dob: string;
  /** seats[journeyIndex][legIndex] */
  seats: (string | null)[][];
}

export interface Passenger extends PassengerInput {
  ticketNumber: string;
}

export interface Booking {
  pnr: string;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  cancelledAt?: string;
  cabin: Cabin;
  journeys: { legs: Leg[] }[];
  passengers: Passenger[];
  contact: { email: string; phone: string };
  fare: { currency: string; base: number; taxes: number; total: number };
  payment: { brand: string; last4: string; holder: string };
  milesEarned: number;
}

export interface Aircraft {
  code: string;
  name: string;
  nickname: string;
  category: string;
  count: number;
  routes: number;
  rangeKm: number;
  cruiseKmh: number;
  description: string;
  cargo: boolean;
  cargoTonnes?: number;
  seats: Partial<Record<Cabin, number>>;
}

export interface CabinInfo {
  code: string;
  label: string;
  baggage: string;
  perks: string[];
}

export interface Tier {
  id: string;
  name: string;
  minMiles: number;
  perks: string[];
}

export interface NetworkLink {
  routeId: string;
  from: string;
  to: string;
  km: number;
  aircraft: string;
  registration: string;
  flightNo: string;
  operator: AirlineCode;
  cargo: boolean;
  weeklyFlights: number;
  blockMin: number;
}

export interface AdminRoute {
  id: string;
  from: string;
  to: string;
  flightNumber: string;
  aircraft: string;
  registration: string;
  computed: NetworkLink | null;
  problem: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "demo" | "catalyst";
  admin?: boolean;
}

export interface Account {
  user: User;
  loyalty: {
    memberId: string;
    miles: number;
    pending: number;
    current: Tier;
    next: Tier | null;
    toNext: number;
  };
  bookings: Booking[];
}
