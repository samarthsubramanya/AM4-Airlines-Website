export type Cabin = "economy" | "business" | "first";

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
  hub?: "primary" | "secondary";
}

export interface Leg {
  key: string;
  flightNo: string;
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
  count: number;
  rangeKm: number;
  cruiseKmh: number;
  description: string;
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
  from: string;
  to: string;
  km: number;
  aircraft: string;
  weeklyFlights: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  provider: "demo" | "catalyst";
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
