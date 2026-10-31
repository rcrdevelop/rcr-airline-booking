export interface Airport {
  iata: string;
  city: string;
  name: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  { iata: "MAD", city: "Madrid", name: "Adolfo Suárez Barajas", country: "ES" },
  { iata: "BCN", city: "Barcelona", name: "El Prat", country: "ES" },
  { iata: "JFK", city: "Nueva York", name: "John F. Kennedy", country: "US" },
  { iata: "LAX", city: "Los Ángeles", name: "Los Angeles Intl", country: "US" },
  { iata: "MIA", city: "Miami", name: "Miami Intl", country: "US" },
  { iata: "BOG", city: "Bogotá", name: "El Dorado", country: "CO" },
  {
    iata: "MEX",
    city: "Ciudad de México",
    name: "Benito Juárez",
    country: "MX"
  },
  { iata: "CUN", city: "Cancún", name: "Cancún Intl", country: "MX" },
  { iata: "LIM", city: "Lima", name: "Jorge Chávez", country: "PE" },
  {
    iata: "SCL",
    city: "Santiago",
    name: "Arturo Merino Benítez",
    country: "CL"
  },
  { iata: "EZE", city: "Buenos Aires", name: "Ezeiza", country: "AR" },
  { iata: "LHR", city: "Londres", name: "Heathrow", country: "GB" },
  { iata: "CDG", city: "París", name: "Charles de Gaulle", country: "FR" },
  { iata: "FRA", city: "Fráncfort", name: "Frankfurt am Main", country: "DE" },
  { iata: "AMS", city: "Ámsterdam", name: "Schiphol", country: "NL" },
  { iata: "GRU", city: "São Paulo", name: "Guarulhos", country: "BR" }
];

export function airportByIata(iata: string): Airport | undefined {
  return AIRPORTS.find(a => a.iata === iata);
}

export const POPULAR_DESTINATIONS = ["JFK", "BOG", "LHR", "CUN", "CDG", "EZE"];

export type Cabin = "Economy" | "Premium" | "Business";

export const CABINS: { value: Cabin; label: string; mult: number }[] = [
  { value: "Economy", label: "Económica", mult: 1 },
  { value: "Premium", label: "Premium Economy", mult: 1.35 },
  { value: "Business", label: "Business", mult: 2.1 }
];

export function cabinMult(cabin: string): number {
  return CABINS.find(c => c.value === cabin)?.mult ?? 1;
}

export interface Fare {
  id: string;
  label: string;
  mult: number;
  carryOn: string;
  checked: string;
  seatPick: string;
  changeable: boolean;
  refundable: boolean;
}

export const FARES: Fare[] = [
  {
    id: "basic",
    label: "Básica",
    mult: 1,
    carryOn: "Solo artículo personal",
    checked: "No incluida",
    seatPick: "De pago",
    changeable: false,
    refundable: false
  },
  {
    id: "classic",
    label: "Clásica",
    mult: 1.18,
    carryOn: "Equipaje de mano 10 kg",
    checked: "1 pieza × 23 kg",
    seatPick: "Selección incluida",
    changeable: true,
    refundable: false
  },
  {
    id: "flex",
    label: "Flexible",
    mult: 1.45,
    carryOn: "Equipaje de mano 10 kg",
    checked: "2 piezas × 23 kg",
    seatPick: "Selección premium incluida",
    changeable: true,
    refundable: true
  }
];

export interface Flight {
  id: string;
  number: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departure: string; // ISO
  arrival: string; // ISO
  durationMin: number;
  stops: 0 | 1;
  stopOver: string | null;
  aircraft: string;
  price: number;
  cabin: "Economy" | "Business";
}

export type PaxType = "ADT" | "CHD" | "INF";

export interface Passenger {
  name: string;
  doc: string;
  type: PaxType;
}

export const PAX_LABEL: Record<PaxType, string> = {
  ADT: "Adulto",
  CHD: "Niño",
  INF: "Bebé"
};

export interface PaxCount {
  adults: number;
  children: number;
  infants: number;
}

export interface Booking {
  id: string;
  pnr: string;
  flight: Flight;
  returnFlight: Flight | null;
  fare: string;
  returnFare: string | null;
  cabin: string;
  passengers: Passenger[];
  seats: string[];
  returnSeats: string[];
  contact: { email: string; phone: string };
  extras: string[];
  total: number;
  createdAt: string;
  status: "Confirmada" | "Check-in" | "Cancelada";
}

/** Viaje en curso guardado en sessionStorage entre búsqueda y reserva. */
export interface Trip {
  flight: Flight;
  returnFlight: Flight | null;
  fare: Fare;
  returnFare: Fare | null;
  cabin: Cabin;
  pax: PaxCount;
}

const AIRLINES = [
  { code: "SK", name: "SkyAir" },
  { code: "RC", name: "RCR Airways" },
  { code: "AN", name: "Andes Air" },
  { code: "IB", name: "Iberia Demo" }
];

const AIRCRAFT = [
  "Boeing 737-800",
  "Airbus A320neo",
  "Boeing 787-9",
  "Airbus A350-900",
  "Embraer E190"
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Genera vuelos determinísticos para una ruta y fecha. */
export function generateFlights(
  origin: string,
  dest: string,
  date: string
): Flight[] {
  const r = rng(hash(`${origin}${dest}${date}`));
  const baseDist = 1.2 + (hash(origin + dest) % 700) / 300; // horas base
  const n = 4 + Math.floor(r() * 4);
  const out: Flight[] = [];
  for (let i = 0; i < n; i++) {
    const al = AIRLINES[Math.floor(r() * AIRLINES.length)]!;
    const depH = 5 + Math.floor(r() * 17);
    const depM = Math.floor(r() * 4) * 15;
    const stops: 0 | 1 = r() < 0.62 ? 0 : 1;
    const durationMin = Math.round(baseDist * 60 + stops * 85 + r() * 45);
    const dep = new Date(
      `${date}T${String(depH).padStart(2, "0")}:${String(depM).padStart(2, "0")}:00`
    );
    const arr = new Date(dep.getTime() + durationMin * 60000);
    const price =
      Math.round((60 + baseDist * 55 + r() * 140 - (stops ? 25 : 0)) * 100) /
      100;
    let stopOver: string | null = null;
    if (stops) {
      const pool = AIRPORTS.filter(a => a.iata !== origin && a.iata !== dest);
      stopOver = pool[Math.floor(r() * pool.length)]!.iata;
    }
    out.push({
      id: `${origin}${dest}${date}-${i}`,
      number: `${al.code}-${100 + Math.floor(r() * 800)}`,
      airline: al.name,
      airlineCode: al.code,
      origin,
      destination: dest,
      departure: dep.toISOString(),
      arrival: arr.toISOString(),
      durationMin,
      stops,
      stopOver,
      aircraft: AIRCRAFT[Math.floor(r() * AIRCRAFT.length)]!,
      price: Math.max(49, price),
      cabin: r() < 0.18 ? "Business" : "Economy"
    });
  }
  return out.sort((a, b) => a.price - b.price);
}

export function makePnr(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "RCR";
  for (let i = 0; i < 3; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/** Seat map: 2-2 business rows 1-3, 3-3 economy rows 5-28. */
export const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"];
export function seatRows(): { row: number; business: boolean }[] {
  const rows: { row: number; business: boolean }[] = [];
  for (let r = 1; r <= 28; r++) rows.push({ row: r, business: r <= 3 });
  return rows;
}
export function seatsForRow(row: number): string[] {
  return row <= 3 ? ["A", "C", "D", "F"] : SEAT_LETTERS;
}

/** Filas seleccionables según la cabina comprada. */
export function rowAllowed(row: number, cabin: string): boolean {
  return cabin === "Business" ? row <= 3 : row > 3;
}

/** Asientos ocupados determinísticos por vuelo. */
export function occupiedSeats(flightId: string): Set<string> {
  const r = rng(hash(flightId));
  const set = new Set<string>();
  for (let row = 1; row <= 28; row++)
    for (const l of seatsForRow(row)) if (r() < 0.32) set.add(`${row}${l}`);
  return set;
}

export interface FlightStatus {
  label: string;
  color: string;
  delayMin: number;
  cancelled: boolean;
  gate: string;
  terminal: string;
  departure: string; // ISO ajustada por retraso
  arrival: string; // ISO ajustada por retraso
}

/** Estado determinístico del vuelo combinado con la hora actual. */
export function statusForFlight(f: Flight, now = Date.now()): FlightStatus {
  const r = rng(hash(f.id + "|status"));
  const gate = `${String.fromCharCode(65 + Math.floor(r() * 6))}${1 + Math.floor(r() * 40)}`;
  const terminal = `T${1 + Math.floor(r() * 4)}`;
  const cancelled = r() < 0.04;
  const delayMin = !cancelled && r() < 0.28 ? 15 + Math.floor(r() * 75) : 0;
  const dep = new Date(f.departure).getTime() + delayMin * 60000;
  const arr = new Date(f.arrival).getTime() + delayMin * 60000;

  let label = "A tiempo";
  let color = "positive";
  if (cancelled) {
    label = "Cancelado";
    color = "negative";
  } else if (now >= arr) {
    label = "Aterrizado";
    color = "grey-7";
  } else if (now >= dep) {
    label = "En vuelo";
    color = "info";
  } else if (dep - now < 45 * 60000) {
    label = "Última llamada";
    color = "warning";
  } else if (dep - now < 3 * 3600000) {
    label = "Embarque próximo";
    color = "info";
  }
  if (!cancelled && delayMin > 0 && now < dep) {
    label = `Retrasado +${delayMin}m`;
    color = "warning";
  }
  return {
    label,
    color,
    delayMin,
    cancelled,
    gate,
    terminal,
    departure: new Date(dep).toISOString(),
    arrival: new Date(arr).toISOString()
  };
}

export function fmtDur(min: number): string {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export const EXTRA_PRICES: Record<string, number> = {
  "Equipaje de mano": 25,
  "Equipaje facturado": 45,
  "Embarque prioritario": 15,
  "Selección premium": 12,
  "Seguro de viaje": 19,
  "Comida a bordo": 14,
  "Wi-Fi a bordo": 9,
  "Mascota en cabina": 60
};
