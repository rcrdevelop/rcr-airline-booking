<template>
  <q-page class="bg-grey-1">
    <div class="hero q-pa-lg">
      <div class="text-h4 text-bold text-white">Vuela a cualquier parte</div>
      <div class="text-subtitle2 text-white opacity-85"
        >Búsqueda y reserva con selección de asiento en tiempo real</div
      >

      <!-- Buscador -->
      <q-card class="q-pa-md q-mt-md search-card">
        <q-btn-toggle
          v-model="store.tripType"
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          :options="[
            { label: 'Ida y vuelta', value: 'round' },
            { label: 'Solo ida', value: 'oneway' }
          ]"
          class="q-mb-md"
        />
        <div class="row q-col-gutter-sm items-end">
          <q-select
            v-model="store.origin"
            :options="airportOpts"
            label="Origen"
            filled
            dense
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            class="col-12 col-sm-3"
            @filter="filterAirports"
          />
          <div class="col-auto q-pb-xs">
            <q-btn round flat icon="swap_horiz" @click="swap" />
          </div>
          <q-select
            v-model="store.destination"
            :options="airportOpts"
            label="Destino"
            filled
            dense
            emit-value
            map-options
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            class="col-12 col-sm-3"
            @filter="filterAirports"
          />
          <q-input
            v-model="store.date"
            type="date"
            label="Salida"
            filled
            dense
            class="col-6 col-sm-2"
          />
          <q-input
            v-if="store.tripType === 'round'"
            v-model="store.returnDate"
            type="date"
            label="Regreso"
            filled
            dense
            class="col-6 col-sm-2"
          />

          <!-- Pasajeros -->
          <q-btn
            outline
            color="primary"
            icon="group"
            no-caps
            :label="paxLabel"
            class="col-6 col-sm-auto"
          >
            <q-menu>
              <q-list dense class="q-pa-sm" style="min-width: 240px">
                <q-item v-for="p in paxRows" :key="p.key">
                  <q-item-section>
                    <q-item-label>{{ p.label }}</q-item-label>
                    <q-item-label caption>{{ p.hint }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="row items-center q-gutter-xs">
                      <q-btn
                        round
                        dense
                        flat
                        icon="remove"
                        :disable="store.pax[p.key] <= p.min"
                        @click="store.pax[p.key]--"
                      />
                      <b>{{ store.pax[p.key] }}</b>
                      <q-btn
                        round
                        dense
                        flat
                        icon="add"
                        :disable="
                          store.totalPax >= 9 || store.pax[p.key] >= p.max
                        "
                        @click="store.pax[p.key]++"
                      />
                    </div>
                  </q-item-section>
                </q-item>
                <q-item dense>
                  <q-item-section class="text-caption text-grey-6"
                    >Máx. 9 pasajeros · los bebés viajan en
                    brazos</q-item-section
                  >
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-select
            v-model="store.cabin"
            :options="CABINS"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            label="Cabina"
            filled
            dense
            class="col-6 col-sm-2"
          />
          <q-btn
            color="primary"
            unelevated
            size="lg"
            icon="search"
            label="Buscar"
            no-caps
            class="col-12 col-sm-3"
            @click="search"
          />
        </div>
      </q-card>
    </div>

    <!-- Resultados -->
    <div v-if="store.searched" class="q-pa-md">
      <div class="row q-col-gutter-md">
        <!-- Filtros -->
        <div class="col-12 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <div class="text-subtitle2 q-mb-sm">Filtros</div>
            <q-toggle v-model="store.onlyDirect" label="Solo directos" />
            <q-select
              v-model="store.airline"
              :options="store.airlines"
              label="Aerolínea"
              dense
              outlined
              clearable
              class="q-mt-sm"
            />
            <div class="text-caption text-grey-7 q-mt-md"
              >Precio máx: ${{ store.maxPrice }}</div
            >
            <q-slider
              v-model="store.maxPrice"
              :min="50"
              :max="2000"
              :step="25"
              color="primary"
            />
            <div class="text-caption text-grey-7 q-mt-md">Ordenar por</div>
            <q-btn-toggle
              v-model="store.sortBy"
              no-caps
              dense
              spread
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="[
                { label: 'Precio', value: 'price' },
                { label: 'Duración', value: 'duration' },
                { label: 'Salida', value: 'departure' }
              ]"
              class="q-mt-xs"
            />
          </q-card>
        </div>

        <!-- Listas de vuelos -->
        <div class="col-12 col-md-9">
          <div class="text-subtitle2 q-mb-xs">
            {{
              store.tripType === "round" && selOutbound
                ? "Vuelo de ida seleccionado"
                : "Vuelos de ida"
            }}
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            {{ store.filteredResults.length }} vuelos · {{ store.origin }} →
            {{ store.destination }} · {{ store.date }}
          </div>

          <template v-if="!(store.tripType === 'round' && selOutbound)">
            <flight-card
              v-for="f in store.filteredResults"
              :key="f.id"
              :flight="f"
              :cabin="store.cabin"
              @details="detailsFlight = f"
              @select="chooseOutbound(f)"
            />
            <empty-results v-if="!store.filteredResults.length" />
          </template>
          <q-banner
            v-else
            class="bg-primary text-white rounded-borders q-mb-md row items-center"
          >
            <template v-slot:avatar><q-icon name="check_circle" /></template>
            <div class="col">
              {{ selOutbound.airline }} {{ selOutbound.number }} ·
              {{ selOutbound.origin }} → {{ selOutbound.destination }} ·
              {{ fmtTime(selOutbound.departure) }} · Tarifa
              {{ selFare?.label }}
            </div>
            <q-btn flat dense no-caps label="Cambiar" @click="clearOutbound" />
          </q-banner>

          <!-- Vuelos de regreso -->
          <template v-if="store.tripType === 'round' && selOutbound">
            <div class="text-subtitle2 q-mt-lg q-mb-xs">Vuelos de regreso</div>
            <div class="text-caption text-grey-7 q-mb-sm">
              {{ store.filteredReturn.length }} vuelos ·
              {{ store.destination }} → {{ store.origin }} ·
              {{ store.returnDate }}
            </div>
            <flight-card
              v-for="f in store.filteredReturn"
              :key="f.id"
              :flight="f"
              :cabin="store.cabin"
              @details="detailsFlight = f"
              @select="chooseReturn(f)"
            />
            <empty-results v-if="!store.filteredReturn.length" />
          </template>
        </div>
      </div>
    </div>

    <!-- Landing: destinos y ventajas -->
    <template v-else>
      <div class="q-pa-md">
        <div class="text-h6 text-bold q-mb-sm">Destinos populares</div>
        <div class="row q-col-gutter-md">
          <div
            v-for="d in popular"
            :key="d.iata"
            class="col-6 col-sm-4 col-md-2"
          >
            <q-card
              flat
              bordered
              class="dest cursor-pointer"
              @click="goPopular(d.iata)"
            >
              <q-card-section class="text-center">
                <div class="text-h5 text-bold text-primary">{{ d.iata }}</div>
                <div class="text-caption text-grey-8">{{ d.city }}</div>
                <div class="text-caption text-grey-6">desde ${{ d.price }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="text-h6 text-bold q-mt-lg q-mb-sm"
          >¿Por qué reservar con SkyBook?</div
        >
        <div class="row q-col-gutter-md">
          <div v-for="f in FEATURES" :key="f.title" class="col-12 col-sm-4">
            <q-card flat bordered class="q-pa-md full-height">
              <q-icon :name="f.icon" size="32px" color="primary" />
              <div class="text-subtitle2 q-mt-sm">{{ f.title }}</div>
              <div class="text-caption text-grey-7">{{ f.text }}</div>
            </q-card>
          </div>
        </div>
      </div>
    </template>

    <!-- Diálogos -->
    <flight-details-dialog v-model="detailsOpen" :flight="detailsFlight" />
    <fare-select-dialog
      v-model="fareOpen"
      :flight="fareFlight"
      :cabin="store.cabin"
      :leg-label="fareLeg === 'out' ? 'Vuelo de ida' : 'Vuelo de regreso'"
      @select="onFare"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import {
  AIRPORTS,
  CABINS,
  POPULAR_DESTINATIONS,
  airportByIata,
  cabinMult,
  fmtDur,
  fmtTime,
  generateFlights,
  type Fare,
  type Flight,
  type Trip
} from "@/lib/flights";
import { useFlightsStore } from "@/stores/flights";
import FlightDetailsDialog from "@/components/FlightDetailsDialog.vue";
import FareSelectDialog from "@/components/FareSelectDialog.vue";
import FlightCard from "@/components/FlightCard.vue";
import EmptyResults from "@/components/EmptyResults.vue";

const store = useFlightsStore();
const router = useRouter();
const $q = useQuasar();

const allAirportOpts = AIRPORTS.map(a => ({
  label: `${a.iata} — ${a.city} (${a.name})`,
  value: a.iata
}));
const airportOpts = ref(allAirportOpts);

const paxRows = [
  { key: "adults", label: "Adultos", hint: "12+ años", min: 1, max: 9 },
  { key: "children", label: "Niños", hint: "2-11 años", min: 0, max: 8 },
  {
    key: "infants",
    label: "Bebés",
    hint: "0-23 meses, en brazos",
    min: 0,
    max: 4
  }
] as const;

const paxLabel = computed(() => {
  const p = store.pax;
  const parts = [`${p.adults} adulto${p.adults > 1 ? "s" : ""}`];
  if (p.children) parts.push(`${p.children} niño${p.children > 1 ? "s" : ""}`);
  if (p.infants) parts.push(`${p.infants} bebé${p.infants > 1 ? "s" : ""}`);
  return parts.join(", ");
});

const popular = computed(() =>
  POPULAR_DESTINATIONS.map(iata => {
    const f = generateFlights(store.origin, iata, store.date)[0];
    return {
      iata,
      city: airportByIata(iata)?.city ?? iata,
      price: f ? (f.price * cabinMult(store.cabin)).toFixed(0) : "—"
    };
  })
);

const FEATURES = [
  {
    icon: "event_seat",
    title: "Elige tu asiento en vivo",
    text: "Mapa interactivo del avión con asientos ocupados y bloqueos de otros usuarios en tiempo real."
  },
  {
    icon: "qr_code_2",
    title: "Pase de abordar con QR",
    text: "Recibe tu tarjeta de embarque con código QR verificable, descargable en PDF."
  },
  {
    icon: "manage_search",
    title: "Gestiona tu reserva",
    text: "Check-in online, cambio de asiento, extras y cancelación con tu código PNR."
  }
];

const detailsFlight = ref<Flight | null>(null);
const detailsOpen = computed({
  get: () => detailsFlight.value !== null,
  set: v => {
    if (!v) detailsFlight.value = null;
  }
});

const selOutbound = ref<Flight | null>(null);
const selFare = ref<Fare | null>(null);
const fareOpen = ref(false);
const fareFlight = ref<Flight | null>(null);
const fareLeg = ref<"out" | "ret">("out");

function filterAirports(val: string, update: (fn: () => void) => void) {
  update(() => {
    const q = (val || "").toLowerCase();
    airportOpts.value = q
      ? allAirportOpts.filter(o => o.label.toLowerCase().includes(q))
      : allAirportOpts;
  });
}

function swap() {
  [store.origin, store.destination] = [store.destination, store.origin];
}

function search() {
  if (store.origin === store.destination) {
    $q.notify({
      type: "warning",
      message: "Origen y destino no pueden ser iguales"
    });
    return;
  }
  if (store.tripType === "round" && store.returnDate < store.date) {
    $q.notify({
      type: "warning",
      message: "La fecha de regreso debe ser posterior a la de salida"
    });
    return;
  }
  selOutbound.value = null;
  selFare.value = null;
  const out = generateFlights(store.origin, store.destination, store.date);
  const ret =
    store.tripType === "round"
      ? generateFlights(store.destination, store.origin, store.returnDate)
      : [];
  store.setResults(out, ret);
}

function goPopular(iata: string) {
  store.destination = iata;
  if (store.origin === iata) store.origin = "MAD";
  search();
}

function chooseOutbound(f: Flight) {
  fareLeg.value = "out";
  fareFlight.value = f;
  fareOpen.value = true;
}
function chooseReturn(f: Flight) {
  fareLeg.value = "ret";
  fareFlight.value = f;
  fareOpen.value = true;
}
function clearOutbound() {
  selOutbound.value = null;
  selFare.value = null;
}

function onFare(fare: Fare) {
  if (fareLeg.value === "out") {
    selOutbound.value = fareFlight.value;
    selFare.value = fare;
    if (store.tripType === "oneway" && selOutbound.value) finish(null, null);
  } else {
    finish(fareFlight.value, fare);
  }
}

function finish(returnFlight: Flight | null, returnFare: Fare | null) {
  const trip: Trip = {
    flight: selOutbound.value!,
    returnFlight,
    fare: selFare.value!,
    returnFare,
    cabin: store.cabin,
    pax: { ...store.pax }
  };
  sessionStorage.setItem("rcr-trip", JSON.stringify(trip));
  void router.push("/reservar");
}
</script>

<style scoped>
.hero {
  background: linear-gradient(120deg, #1d4ed8, #0ea5e9);
}
.search-card {
  border-radius: 14px;
}
.dest:hover {
  border-color: var(--q-primary);
}
</style>
