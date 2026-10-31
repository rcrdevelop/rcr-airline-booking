<template>
  <q-page class="bg-grey-1 q-pa-md">
    <div class="row q-col-gutter-md justify-center">
      <div class="col-12 col-md-6">
        <q-card flat bordered class="q-pa-md">
          <div class="text-h6 q-mb-sm">Gestionar mi reserva</div>
          <div class="row q-gutter-sm">
            <q-input
              v-model="pnr"
              label="Código PNR (ej. RCR7K2)"
              filled
              dense
              class="col"
              @keyup.enter="find"
            />
            <q-btn
              color="primary"
              unelevated
              no-caps
              label="Buscar"
              @click="find"
            />
          </div>
          <div v-if="notFound" class="text-negative text-caption q-mt-sm">
            No se encontró ninguna reserva con ese código.
          </div>
        </q-card>

        <q-list
          v-if="store.bookings.length"
          bordered
          separator
          class="bg-white rounded-borders q-mt-md"
        >
          <q-item-label header>Mis reservas</q-item-label>
          <q-item
            v-for="b in store.bookings"
            :key="b.id"
            clickable
            @click="show(b)"
          >
            <q-item-section avatar
              ><q-icon name="confirmation_number" color="primary"
            /></q-item-section>
            <q-item-section>
              <q-item-label class="text-bold">{{ b.pnr }}</q-item-label>
              <q-item-label caption>
                {{ b.flight.origin }} → {{ b.flight.destination }}
                {{ b.returnFlight ? "· ida y vuelta" : "" }} ·
                {{ b.passengers.length }} pax
              </q-item-label>
            </q-item-section>
            <q-item-section side
              ><q-badge :color="statusColor(b.status)" :label="b.status"
            /></q-item-section>
          </q-item>
        </q-list>

        <!-- Resumen -->
        <q-card v-if="current" flat bordered class="q-pa-md q-mt-md">
          <div class="row items-center">
            <div class="text-subtitle1 text-bold"
              >Reserva {{ current.pnr }}</div
            >
            <q-space />
            <q-badge
              :color="statusColor(current.status)"
              :label="current.status"
            />
          </div>

          <q-list dense class="q-mt-sm">
            <q-item>
              <q-item-section avatar
                ><q-icon name="flight_takeoff" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ current.flight.airline }} {{ current.flight.number }} ·
                  {{ current.flight.origin }} → {{ current.flight.destination }}
                </q-item-label>
                <q-item-label caption>
                  {{ fmtDate(current.flight.departure) }} ·
                  {{ fmtTime(current.flight.departure) }} –{{
                    fmtTime(current.flight.arrival)
                  }}
                  · {{ current.cabin }} · Tarifa {{ current.fare }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="current.returnFlight">
              <q-item-section avatar
                ><q-icon name="flight_land" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ current.returnFlight.airline }}
                  {{ current.returnFlight.number }} ·
                  {{ current.returnFlight.origin }} →
                  {{ current.returnFlight.destination }}
                </q-item-label>
                <q-item-label caption>
                  {{ fmtDate(current.returnFlight.departure) }} ·
                  {{ fmtTime(current.returnFlight.departure) }} –{{
                    fmtTime(current.returnFlight.arrival)
                  }}
                  · Tarifa {{ current.returnFare }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar
                ><q-icon name="group" color="primary"
              /></q-item-section>
              <q-item-section>
                <q-item-label
                  v-for="(p, i) in current.passengers"
                  :key="i"
                  class="text-caption"
                >
                  {{ p.name }} ({{ PAX_LABEL[p.type] }})
                  <template v-if="p.type !== 'INF'"
                    >· Asiento {{ current.seats[i] ?? "—"
                    }}<template v-if="current.returnFlight">
                      / {{ current.returnSeats[i] ?? "—" }}</template
                    ></template
                  >
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="current.extras.length">
              <q-item-section avatar
                ><q-icon name="add_circle" color="primary"
              /></q-item-section>
              <q-item-section class="text-caption">{{
                current.extras.join(" · ")
              }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar
                ><q-icon name="payments" color="primary"
              /></q-item-section>
              <q-item-section
                >Total pagado:
                <b>${{ current.total.toFixed(2) }}</b></q-item-section
              >
            </q-item>
          </q-list>

          <q-separator class="q-my-sm" />
          <div class="row q-gutter-sm justify-center">
            <q-btn
              v-if="current.status === 'Confirmada'"
              color="primary"
              unelevated
              no-caps
              icon="fact_check"
              label="Hacer check-in"
              @click="checkin"
            />
            <q-btn
              v-if="current.status !== 'Cancelada'"
              outline
              color="primary"
              no-caps
              icon="event_seat"
              label="Cambiar asientos"
              @click="openSeatChange"
            />
            <q-btn
              v-if="current.status !== 'Cancelada'"
              outline
              color="primary"
              no-caps
              icon="add_circle"
              label="Añadir extras"
              @click="extrasOpen = true"
            />
            <q-btn
              outline
              color="primary"
              no-caps
              icon="picture_as_pdf"
              label="PDF"
              @click="pdf"
            />
            <q-btn
              flat
              no-caps
              icon="print"
              label="Imprimir"
              @click="printPass"
            />
            <q-btn
              v-if="current.status !== 'Cancelada'"
              flat
              color="negative"
              no-caps
              icon="cancel"
              label="Cancelar reserva"
              @click="cancelOpen = true"
            />
          </div>
        </q-card>
      </div>

      <!-- Pases de abordar -->
      <div
        v-if="current && current.status !== 'Cancelada'"
        class="col-12 col-md-5"
      >
        <div class="text-subtitle2 text-center q-mb-sm">Pases de abordar</div>
        <div v-for="(p, i) in current.passengers" :key="i" class="q-mb-md">
          <BoardingPass :booking="current" :index="i" class="q-mx-auto" />
          <BoardingPass
            v-if="current.returnFlight"
            :booking="current"
            :index="i"
            retour
            class="q-mx-auto q-mt-sm"
          />
        </div>
      </div>
    </div>

    <!-- Cambiar asientos -->
    <q-dialog v-model="seatOpen">
      <q-card class="q-pa-md" style="max-width: 480px">
        <div class="text-subtitle1 text-bold q-mb-sm"
          >Cambiar asientos de ida</div
        >
        <SeatMap
          v-if="current"
          :occupied="seatChangeOccupied"
          :selected="draftSeats"
          :cabin="current.cabin"
          @select="s => toggleDraft(s)"
        />
        <template v-if="current?.returnFlight">
          <div class="text-subtitle1 text-bold q-my-sm"
            >Cambiar asientos de regreso</div
          >
          <SeatMap
            :occupied="seatChangeOccupiedRet"
            :selected="draftRetSeats"
            :cabin="current.cabin"
            @select="s => toggleDraftRet(s)"
          />
        </template>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" v-close-popup />
          <q-btn
            color="primary"
            unelevated
            no-caps
            label="Guardar asientos"
            :disable="
              draftSeats.length !== seatedPax ||
              (current?.returnFlight != null &&
                draftRetSeats.length !== seatedPax)
            "
            @click="saveSeats"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Añadir extras -->
    <q-dialog v-model="extrasOpen">
      <q-card class="q-pa-md" style="max-width: 380px">
        <div class="text-subtitle1 text-bold q-mb-sm">Añadir extras</div>
        <q-option-group
          v-model="draftExtras"
          :options="availableExtras"
          type="checkbox"
        />
        <div class="row text-subtitle2 q-mt-sm"
          ><span>Adicional</span><q-space /><span
            >${{ draftExtrasTotal.toFixed(2) }}</span
          ></div
        >
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" v-close-popup />
          <q-btn
            color="primary"
            unelevated
            no-caps
            label="Añadir"
            :disable="!draftExtras.length"
            @click="saveExtras"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cancelar -->
    <q-dialog v-model="cancelOpen" persistent>
      <q-card class="q-pa-md" style="max-width: 360px">
        <div class="text-h6">Cancelar reserva</div>
        <div class="text-caption text-grey-7 q-mt-sm">
          ¿Seguro que quieres cancelar la reserva {{ current?.pnr }}?
          {{ refundable }}
        </div>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Volver" v-close-popup />
          <q-btn
            color="negative"
            unelevated
            no-caps
            label="Cancelar reserva"
            @click="cancel"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import BoardingPass from "@/components/BoardingPass.vue";
import SeatMap from "@/components/SeatMap.vue";
import {
  EXTRA_PRICES,
  PAX_LABEL,
  fmtDate,
  fmtTime,
  occupiedSeats,
  type Booking
} from "@/lib/flights";
import { downloadBoardingPassPdf } from "@/lib/boardingPdf";
import { useFlightsStore } from "@/stores/flights";

const store = useFlightsStore();
const pnr = ref("");
const current = ref<Booking | null>(null);
const notFound = ref(false);

const seatOpen = ref(false);
const extrasOpen = ref(false);
const cancelOpen = ref(false);
const draftSeats = ref<string[]>([]);
const draftRetSeats = ref<string[]>([]);
const draftExtras = ref<string[]>([]);

const seatedPax = computed(
  () => current.value?.passengers.filter(p => p.type !== "INF").length ?? 0
);
const refundable = computed(() =>
  current.value?.fare === "Flexible" || current.value?.returnFare === "Flexible"
    ? "Tu tarifa Flexible permite reembolso."
    : "La tarifa no es reembolsable; se emitirá un bono por el importe."
);
const seatChangeOccupied = computed(() =>
  current.value
    ? new Set([
        ...occupiedSeats(current.value.flight.id),
        ...store.bookedSeats(current.value.flight.id, current.value.pnr)
      ])
    : new Set<string>()
);
const seatChangeOccupiedRet = computed(() =>
  current.value?.returnFlight
    ? new Set([
        ...occupiedSeats(current.value.returnFlight.id),
        ...store.bookedSeats(current.value.returnFlight.id, current.value.pnr)
      ])
    : new Set<string>()
);
const availableExtras = computed(() =>
  Object.entries(EXTRA_PRICES)
    .filter(([label]) => !current.value?.extras.includes(label))
    .map(([label, p]) => ({ label: `${label} (+$${p})`, value: label }))
);
const draftExtrasTotal = computed(() =>
  draftExtras.value.reduce((s, e) => s + (EXTRA_PRICES[e] ?? 0), 0)
);

function statusColor(s: Booking["status"]): string {
  return s === "Cancelada"
    ? "negative"
    : s === "Check-in"
      ? "positive"
      : "primary";
}
function find() {
  const b = store.byPnr(pnr.value.trim());
  current.value = b ?? null;
  notFound.value = !b;
}
function show(b: Booking) {
  current.value = b;
  notFound.value = false;
}
function checkin() {
  if (current.value) {
    current.value = { ...current.value, status: "Check-in" };
    store.updateBooking(current.value);
  }
}
function openSeatChange() {
  draftSeats.value = [...(current.value?.seats ?? [])];
  draftRetSeats.value = [...(current.value?.returnSeats ?? [])];
  seatOpen.value = true;
}
function toggleDraft(s: string) {
  toggleIn(draftSeats.value, s);
}
function toggleDraftRet(s: string) {
  toggleIn(draftRetSeats.value, s);
}
function toggleIn(arr: string[], s: string) {
  const i = arr.indexOf(s);
  if (i >= 0) arr.splice(i, 1);
  else if (arr.length < seatedPax.value) arr.push(s);
}
function saveSeats() {
  if (!current.value) return;
  current.value = {
    ...current.value,
    seats: [...draftSeats.value],
    returnSeats: [...draftRetSeats.value]
  };
  store.updateBooking(current.value);
  seatOpen.value = false;
}
function saveExtras() {
  if (!current.value) return;
  current.value = {
    ...current.value,
    extras: [...current.value.extras, ...draftExtras.value],
    total: current.value.total + draftExtrasTotal.value
  };
  store.updateBooking(current.value);
  draftExtras.value = [];
  extrasOpen.value = false;
}
function cancel() {
  if (current.value) {
    current.value = { ...current.value, status: "Cancelada" };
    store.updateBooking(current.value);
  }
  cancelOpen.value = false;
}
async function pdf() {
  if (current.value) await downloadBoardingPassPdf(current.value);
}
function printPass() {
  window.print();
}
</script>
