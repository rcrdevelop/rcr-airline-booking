import { defineStore, acceptHMRUpdate } from "pinia";
import type { Booking, Cabin, Flight, PaxCount } from "@/lib/flights";

const KEY = "rcr-flights-v2";
const in7d = new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
const in10d = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);

export const useFlightsStore = defineStore("flights", {
  state: () => ({
    bookings: load(),
    // búsqueda
    tripType: "oneway" as "oneway" | "round",
    origin: "MAD",
    destination: "JFK",
    date: in7d,
    returnDate: in10d,
    pax: { adults: 1, children: 0, infants: 0 } as PaxCount,
    cabin: "Economy" as Cabin,
    results: [] as Flight[],
    returnResults: [] as Flight[],
    searched: false,
    // filtros
    onlyDirect: false,
    airline: null as string | null,
    maxPrice: 2000,
    sortBy: "price" as "price" | "duration" | "departure"
  }),

  getters: {
    filteredResults(state): Flight[] {
      return sort(
        state.results.filter(f => matches(f, state)),
        state.sortBy
      );
    },
    filteredReturn(state): Flight[] {
      return sort(
        state.returnResults.filter(f => matches(f, state)),
        state.sortBy
      );
    },
    airlines(state): string[] {
      return [...new Set(state.results.map(f => f.airline))];
    },
    /** Pasajeros que ocupan asiento (los bebés viajan en brazos). */
    seatPax(state): number {
      return state.pax.adults + state.pax.children;
    },
    totalPax(state): number {
      return state.pax.adults + state.pax.children + state.pax.infants;
    },
    byPnr: state => (pnr: string) =>
      state.bookings.find(b => b.pnr.toUpperCase() === pnr.toUpperCase()),
    /** Asientos ya reservados por otras reservas para un vuelo dado. */
    bookedSeats: state => (flightId: string, exceptPnr?: string) =>
      new Set(
        state.bookings
          .filter(
            b =>
              b.status !== "Cancelada" &&
              b.pnr !== exceptPnr &&
              (b.flight.id === flightId || b.returnFlight?.id === flightId)
          )
          .flatMap(b => (b.flight.id === flightId ? b.seats : b.returnSeats))
      )
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.bookings));
      } catch {
        /* ignore */
      }
    },
    addBooking(b: Booking) {
      this.bookings.unshift(b);
      this.persist();
    },
    updateBooking(b: Booking) {
      const i = this.bookings.findIndex(x => x.id === b.id);
      if (i >= 0) this.bookings[i] = b;
      this.persist();
    },
    setResults(out: Flight[], ret: Flight[] = []) {
      this.results = out;
      this.returnResults = ret;
      this.searched = true;
    }
  }
});

function matches(
  f: Flight,
  s: { onlyDirect: boolean; airline: string | null; maxPrice: number }
): boolean {
  if (s.onlyDirect && f.stops > 0) return false;
  if (s.airline && f.airline !== s.airline) return false;
  if (f.price > s.maxPrice) return false;
  return true;
}

function sort(
  list: Flight[],
  by: "price" | "duration" | "departure"
): Flight[] {
  const arr = [...list];
  if (by === "duration") arr.sort((a, b) => a.durationMin - b.durationMin);
  else if (by === "departure")
    arr.sort((a, b) => a.departure.localeCompare(b.departure));
  else arr.sort((a, b) => a.price - b.price);
  return arr;
}

function load(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (Array.isArray(d)) return d;
    }
  } catch {
    /* ignore */
  }
  return [];
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFlightsStore, import.meta.hot));
}
