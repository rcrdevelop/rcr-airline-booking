<template>
  <q-page class="bg-grey-1 q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-8">
        <q-card flat bordered class="q-pa-md">
          <div class="text-h6 q-mb-sm">Estado del vuelo</div>
          <div class="row q-col-gutter-sm items-end">
            <q-input
              v-model="number"
              label="Número de vuelo (ej. SK-402)"
              filled
              dense
              class="col-12 col-sm-5"
              @keyup.enter="find"
            />
            <q-input
              v-model="date"
              type="date"
              label="Fecha"
              filled
              dense
              class="col-6 col-sm-4"
            />
            <q-btn
              color="primary"
              unelevated
              no-caps
              label="Consultar"
              class="col-6 col-sm-3"
              @click="find"
            />
          </div>
          <div v-if="notFound" class="text-negative text-caption q-mt-sm">
            No encontramos ese vuelo en la fecha indicada. Prueba con un número
            del tablero de abajo.
          </div>
        </q-card>

        <!-- Tablero de salidas -->
        <q-card flat bordered class="q-pa-md q-mt-md">
          <div class="row items-center q-mb-sm">
            <q-icon name="flight_takeoff" color="primary" class="q-mr-sm" />
            <div class="text-subtitle1 text-bold"
              >Salidas hoy desde Madrid (MAD)</div
            >
          </div>
          <q-markup-table flat dense>
            <thead>
              <tr class="text-left text-grey-7">
                <th>Vuelo</th>
                <th>Destino</th>
                <th>Salida</th>
                <th>Puerta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in board"
                :key="row.flight.id"
                class="cursor-pointer board-row"
                @click="open(row.flight)"
              >
                <td class="text-bold">{{ row.flight.number }}</td>
                <td>{{ row.flight.destination }}</td>
                <td>
                  {{ fmtTime(row.status.departure) }}
                  <span
                    v-if="row.status.delayMin"
                    class="text-warning text-caption"
                  >
                    (est. {{ fmtTime(row.flight.departure) }})</span
                  >
                </td>
                <td>{{ row.status.terminal }}·{{ row.status.gate }}</td>
                <td>
                  <q-badge
                    :color="row.status.color"
                    :label="row.status.label"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
    </div>

    <!-- Detalle de estado -->
    <q-dialog v-model="detailOpen">
      <q-card style="max-width: 420px; width: 100%">
        <q-card-section class="row items-center" v-if="detail">
          <div>
            <div class="text-h6">
              {{ detail.flight.airline }} {{ detail.flight.number }}
            </div>
            <div class="text-caption text-grey-7">
              {{ detail.flight.origin }} → {{ detail.flight.destination }} ·
              {{ fmtDate(detail.flight.departure) }}
            </div>
          </div>
          <q-space />
          <q-badge :color="detail.status.color" :label="detail.status.label" />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="detail">
          <div class="row text-center q-mb-md">
            <div class="col">
              <div class="text-h5 text-bold">{{
                fmtTime(detail.status.departure)
              }}</div>
              <div class="text-caption text-grey-7"
                >{{ detail.flight.origin }} ·
                {{ detail.status.terminal }} puerta
                {{ detail.status.gate }}</div
              >
            </div>
            <div class="col-auto flex flex-center">
              <q-icon name="flight" color="primary" size="28px" />
            </div>
            <div class="col">
              <div class="text-h5 text-bold">{{
                fmtTime(detail.status.arrival)
              }}</div>
              <div class="text-caption text-grey-7">{{
                detail.flight.destination
              }}</div>
            </div>
          </div>
          <q-timeline dense color="primary">
            <q-timeline-entry
              v-for="s in timeline"
              :key="s.label"
              :title="s.label"
              :subtitle="s.time"
              :icon="s.icon"
              :color="s.done ? 'positive' : 'grey-5'"
            />
          </q-timeline>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import {
  POPULAR_DESTINATIONS,
  fmtDate,
  fmtTime,
  generateFlights,
  statusForFlight,
  type Flight,
  type FlightStatus
} from "@/lib/flights";

const $q = useQuasar();
const number = ref("");
const date = ref(new Date().toISOString().slice(0, 10));
const notFound = ref(false);
const detail = ref<{ flight: Flight; status: FlightStatus } | null>(null);
const detailOpen = computed({
  get: () => detail.value !== null,
  set: v => {
    if (!v) detail.value = null;
  }
});

const board = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return POPULAR_DESTINATIONS.flatMap(d => generateFlights("MAD", d, today))
    .sort((a, b) => a.departure.localeCompare(b.departure))
    .map(f => ({ flight: f, status: statusForFlight(f) }));
});

function allFlights(dateStr: string): Flight[] {
  return POPULAR_DESTINATIONS.flatMap(d => [
    ...generateFlights("MAD", d, dateStr),
    ...generateFlights(d, "MAD", dateStr)
  ]);
}

function find() {
  const q = number.value.trim().toUpperCase();
  const f = allFlights(date.value).find(x => x.number === q);
  if (f) open(f);
  else {
    notFound.value = true;
    $q.notify({ type: "warning", message: "Vuelo no encontrado" });
  }
}

function open(f: Flight) {
  detail.value = { flight: f, status: statusForFlight(f) };
  notFound.value = false;
}

const timeline = computed(() => {
  if (!detail.value) return [];
  const s = detail.value.status;
  const now = Date.now();
  const dep = new Date(s.departure).getTime();
  const arr = new Date(s.arrival).getTime();
  const step = (label: string, icon: string, t: number) => ({
    label,
    icon,
    time: fmtTime(new Date(t).toISOString()),
    done: now >= t
  });
  return [
    step("Check-in disponible", "fact_check", dep - 24 * 3600000),
    step("Embarque", "groups", dep - 45 * 60000),
    step("Despegue", "flight_takeoff", dep),
    step("Aterrizaje", "flight_land", arr)
  ];
});
</script>

<style scoped>
.board-row:hover {
  background: #eef4ff;
}
</style>
