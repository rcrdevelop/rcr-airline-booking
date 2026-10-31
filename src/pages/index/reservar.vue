<template>
  <q-page class="bg-grey-1 q-pa-md">
    <div v-if="!trip" class="text-center q-pa-xl">
      <q-icon name="flight" size="48px" color="grey-5" />
      <div class="text-h6 q-mt-sm">No hay vuelo seleccionado</div>
      <q-btn
        color="primary"
        no-caps
        class="q-mt-sm"
        label="Buscar vuelos"
        to="/"
      />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Mapas de asientos -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-bold q-mb-xs">
            Asientos de ida
            <q-badge
              color="primary"
              :label="`${seats.length}/${seatsNeeded}`"
            />
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ trip.flight.origin }} → {{ trip.flight.destination }} · cabina
            {{ trip.cabin }}
          </div>
          <SeatMap
            :occupied="occupiedOut"
            :locked="locked"
            :selected="seats"
            :cabin="trip.cabin"
            @select="s => toggleSeat(s, seats)"
          />
          <div class="text-caption text-grey-6 q-mt-sm text-center">
            Los asientos naranjas están siendo elegidos por otros usuarios en
            este momento.
          </div>
        </q-card>

        <q-card v-if="trip.returnFlight" flat bordered class="q-pa-md q-mt-md">
          <div class="text-subtitle1 text-bold q-mb-xs">
            Asientos de regreso
            <q-badge
              color="primary"
              :label="`${returnSeats.length}/${seatsNeeded}`"
            />
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ trip.returnFlight.origin }} → {{ trip.returnFlight.destination }}
          </div>
          <SeatMap
            :occupied="occupiedRet"
            :selected="returnSeats"
            :cabin="trip.cabin"
            @select="s => toggleSeat(s, returnSeats)"
          />
        </q-card>
      </div>

      <!-- Datos, extras y pago -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="text-subtitle1 text-bold">
            {{ trip.flight.airline }} {{ trip.flight.number }} ·
            {{ trip.flight.origin }} → {{ trip.flight.destination }}
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ fmtDate(trip.flight.departure) }} ·
            {{ fmtTime(trip.flight.departure) }} –
            {{ fmtTime(trip.flight.arrival) }} ·
            {{ fmtDur(trip.flight.durationMin) }} · Tarifa {{ trip.fare.label }}
          </div>
          <div
            v-if="trip.returnFlight"
            class="text-caption text-grey-7 q-mb-sm"
          >
            Regreso: {{ trip.returnFlight.number }} ·
            {{ fmtDate(trip.returnFlight.departure) }} · Tarifa
            {{ trip.returnFare?.label }}
          </div>

          <div class="text-subtitle2 q-mb-xs">Pasajeros</div>
          <div
            v-for="(p, i) in passengers"
            :key="i"
            class="row q-col-gutter-sm q-mb-xs"
          >
            <div class="col-12 text-caption text-grey-7">
              {{ i + 1 }}. {{ PAX_LABEL[p.type] }}
              <span v-if="p.type !== 'INF'" class="text-primary"
                >· Asiento ida {{ seats[i] ?? "?" }}</span
              >
            </div>
            <q-input
              v-model="p.name"
              :label="`Nombre completo (${PAX_LABEL[p.type]})`"
              filled
              dense
              class="col-12 col-sm-7"
            />
            <q-input
              v-model="p.doc"
              label="Pasaporte / ID"
              filled
              dense
              class="col-12 col-sm-5"
            />
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-xs">Contacto</div>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="contact.email"
              label="Email de confirmación"
              type="email"
              filled
              dense
              class="col-12 col-sm-7"
            />
            <q-input
              v-model="contact.phone"
              label="Teléfono"
              filled
              dense
              class="col-12 col-sm-5"
            />
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-xs">Extras</div>
          <q-option-group
            v-model="extras"
            :options="extraOpts"
            type="checkbox"
            inline
          />

          <q-separator class="q-my-md" />
          <div class="row text-caption"
            ><span>Billetes ({{ store.totalPax }} pax{{ infantNote }})</span
            ><q-space /><span>${{ ticketsTotal.toFixed(2) }}</span></div
          >
          <div class="row text-caption"
            ><span>Extras</span><q-space /><span
              >${{ extrasTotal.toFixed(2) }}</span
            ></div
          >
          <div class="row text-h6 text-bold q-mt-xs"
            ><span>Total</span><q-space /><span
              >${{ total.toFixed(2) }}</span
            ></div
          >

          <q-btn
            color="primary"
            unelevated
            class="full-width q-mt-md"
            no-caps
            size="lg"
            icon="lock"
            label="Continuar al pago"
            :disable="!formValid"
            @click="payOpen = true"
          />
          <div v-if="!seatsDone" class="text-caption text-warning q-mt-xs">
            Selecciona {{ seatsNeeded }} asiento(s) de ida
            {{ trip.returnFlight ? "y de regreso " : "" }}para continuar.
          </div>
        </q-card>
      </div>
    </div>

    <!-- Pago -->
    <payment-dialog v-model="payOpen" :amount="total" @paid="book" />

    <!-- Confirmación -->
    <q-dialog v-model="done" persistent>
      <q-card class="q-pa-md text-center" style="max-width: 440px">
        <q-icon name="check_circle" size="60px" color="positive" />
        <div class="text-h6 q-mt-sm">¡Reserva confirmada!</div>
        <div class="text-h4 text-bold text-primary">{{ booking?.pnr }}</div>
        <div class="text-caption text-grey-7 q-mb-sm"
          >Hemos enviado la confirmación a {{ booking?.contact.email }}</div
        >
        <div class="passes q-mb-md">
          <template v-for="(p, i) in booking?.passengers ?? []" :key="i">
            <BoardingPass
              v-if="booking"
              :booking="booking"
              :index="i"
              class="q-mx-auto q-mb-sm"
            />
          </template>
        </div>
        <q-card-actions align="center">
          <q-btn
            color="primary"
            no-caps
            label="Gestionar reserva"
            to="/gestionar"
          />
          <q-btn flat no-caps label="Volver" to="/" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import BoardingPass from "@/components/BoardingPass.vue";
import PaymentDialog from "@/components/PaymentDialog.vue";
import SeatMap from "@/components/SeatMap.vue";
import {
  EXTRA_PRICES,
  PAX_LABEL,
  cabinMult,
  fmtDate,
  fmtDur,
  fmtTime,
  makePnr,
  occupiedSeats,
  seatsForRow,
  type Booking,
  type Passenger,
  type Trip
} from "@/lib/flights";
import { useFlightsStore } from "@/stores/flights";

const store = useFlightsStore();
const $q = useQuasar();

const trip = ref<Trip | null>(null);
const seats = ref<string[]>([]);
const returnSeats = ref<string[]>([]);
const occupiedOut = ref(new Set<string>());
const occupiedRet = ref(new Set<string>());
const locked = ref(new Set<string>());
const extras = ref<string[]>([]);
const passengers = ref<Passenger[]>([]);
const contact = ref({ email: "", phone: "" });
const payOpen = ref(false);
const done = ref(false);
const booking = ref<Booking | null>(null);
let lockTimer: ReturnType<typeof setInterval> | null = null;

const seatsNeeded = computed(() =>
  trip.value ? trip.value.pax.adults + trip.value.pax.children : 0
);
const seatsDone = computed(
  () =>
    seats.value.length === seatsNeeded.value &&
    (!trip.value?.returnFlight ||
      returnSeats.value.length === seatsNeeded.value)
);
const infantNote = computed(() =>
  trip.value?.pax.infants ? `, ${trip.value.pax.infants} en brazos` : ""
);

const extraOpts = Object.entries(EXTRA_PRICES).map(([label, p]) => ({
  label: `${label} (+$${p})`,
  value: label
}));
const extrasTotal = computed(() =>
  extras.value.reduce((s, e) => s + (EXTRA_PRICES[e] ?? 0), 0)
);

const ticketsTotal = computed(() => {
  if (!trip.value) return 0;
  const t = trip.value;
  const seatPax = t.pax.adults + t.pax.children;
  const perSeatPax =
    t.flight.price * cabinMult(t.cabin) * t.fare.mult +
    (t.returnFlight && t.returnFare
      ? t.returnFlight.price * cabinMult(t.cabin) * t.returnFare.mult
      : 0);
  const infant = perSeatPax * 0.1;
  return perSeatPax * seatPax + infant * t.pax.infants;
});
const total = computed(() => ticketsTotal.value + extrasTotal.value);

const formValid = computed(
  () =>
    seatsDone.value &&
    passengers.value.every(p => p.name.trim() && p.doc.trim()) &&
    /.+@.+\..+/.test(contact.value.email)
);

function toggleSeat(s: string, arr: string[]) {
  const i = arr.indexOf(s);
  if (i >= 0) {
    arr.splice(i, 1);
    return;
  }
  if (arr.length >= seatsNeeded.value) {
    $q.notify({
      type: "warning",
      message: `Ya seleccionaste ${seatsNeeded.value} asiento(s)`
    });
    return;
  }
  arr.push(s);
}

onMounted(() => {
  const raw = sessionStorage.getItem("rcr-trip");
  if (!raw) return;
  trip.value = JSON.parse(raw);
  const t = trip.value!;

  occupiedOut.value = new Set([
    ...occupiedSeats(t.flight.id),
    ...store.bookedSeats(t.flight.id)
  ]);
  if (t.returnFlight)
    occupiedRet.value = new Set([
      ...occupiedSeats(t.returnFlight.id),
      ...store.bookedSeats(t.returnFlight.id)
    ]);

  passengers.value = [
    ...Array.from({ length: t.pax.adults }, () => ({
      name: "",
      doc: "",
      type: "ADT" as const
    })),
    ...Array.from({ length: t.pax.children }, () => ({
      name: "",
      doc: "",
      type: "CHD" as const
    })),
    ...Array.from({ length: t.pax.infants }, () => ({
      name: "",
      doc: "",
      type: "INF" as const
    }))
  ];

  // simulación de otros usuarios bloqueando asientos en vivo
  lockTimer = setInterval(() => {
    const l = new Set(locked.value);
    if (Math.random() < 0.6 && l.size < 5) {
      const row = 5 + Math.floor(Math.random() * 20);
      const letters = seatsForRow(row);
      const s = `${row}${letters[Math.floor(Math.random() * letters.length)]}`;
      if (!occupiedOut.value.has(s) && !seats.value.includes(s)) l.add(s);
    } else if (l.size) {
      l.delete([...l][0]!);
    }
    locked.value = l;
  }, 2500);
});
onBeforeUnmount(() => {
  if (lockTimer) clearInterval(lockTimer);
});

function book() {
  const t = trip.value!;
  const b: Booking = {
    id: `bk-${Date.now().toString(36)}`,
    pnr: makePnr(),
    flight: t.flight,
    returnFlight: t.returnFlight,
    fare: t.fare.label,
    returnFare: t.returnFare?.label ?? null,
    cabin: t.cabin,
    passengers: passengers.value.map(p => ({
      name: p.name.trim(),
      doc: p.doc.trim(),
      type: p.type
    })),
    seats: [...seats.value],
    returnSeats: [...returnSeats.value],
    contact: { ...contact.value },
    extras: [...extras.value],
    total: total.value,
    createdAt: new Date().toISOString(),
    status: "Confirmada"
  };
  store.addBooking(b);
  booking.value = b;
  done.value = true;
}
</script>

<style scoped>
.passes {
  max-height: 420px;
  overflow-y: auto;
}
</style>
