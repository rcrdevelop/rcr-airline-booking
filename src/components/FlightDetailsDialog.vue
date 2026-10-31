<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <q-card style="max-width: 460px; width: 100%">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ flight?.airline }} {{ flight?.number }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section v-if="flight" class="q-gutter-md">
        <div>
          <div class="text-subtitle2 q-mb-xs">Itinerario</div>
          <q-timeline dense color="primary">
            <q-timeline-entry
              :title="`${fmtTime(flight.departure)} · ${flight.origin} — ${originName}`"
              :subtitle="fmtDate(flight.departure)"
              icon="flight_takeoff"
            />
            <q-timeline-entry
              v-if="flight.stops && flight.stopOver"
              :title="`Escala en ${flight.stopOver} — ${stopName}`"
              subtitle="Cambio de avión · 1h 25m aprox."
              icon="connecting_airports"
            />
            <q-timeline-entry
              :title="`${fmtTime(flight.arrival)} · ${flight.destination} — ${destName}`"
              :subtitle="`Llegada · Duración total ${fmtDur(flight.durationMin)}`"
              icon="flight_land"
            />
          </q-timeline>
        </div>

        <q-list dense bordered class="rounded-borders">
          <q-item>
            <q-item-section avatar><q-icon name="flight" /></q-item-section>
            <q-item-section>Avión</q-item-section>
            <q-item-section side>{{ flight.aircraft }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="work" /></q-item-section>
            <q-item-section>Equipaje de mano</q-item-section>
            <q-item-section side>Según tarifa</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="luggage" /></q-item-section>
            <q-item-section>Equipaje facturado</q-item-section>
            <q-item-section side>Desde $45</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="wifi" /></q-item-section>
            <q-item-section>Wi-Fi a bordo</q-item-section>
            <q-item-section side>Disponible</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar><q-icon name="restaurant" /></q-item-section>
            <q-item-section>Comida</q-item-section>
            <q-item-section side>De pago / según cabina</q-item-section>
          </q-item>
        </q-list>

        <q-banner dense class="bg-blue-1 text-dark rounded-borders">
          <template v-slot:avatar
            ><q-icon name="info" color="primary"
          /></template>
          Las condiciones de cambio y reembolso dependen de la tarifa elegida en
          el siguiente paso.
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { airportByIata, fmtDate, fmtDur, fmtTime } from "@/lib/flights";
import type { Flight } from "@/lib/flights";

const props = defineProps<{ modelValue: boolean; flight: Flight | null }>();
const emit = defineEmits<{ "update:modelValue": [v: boolean] }>();

const originName = computed(
  () => airportByIata(props.flight?.origin ?? "")?.city ?? ""
);
const destName = computed(
  () => airportByIata(props.flight?.destination ?? "")?.city ?? ""
);
const stopName = computed(
  () => airportByIata(props.flight?.stopOver ?? "")?.city ?? ""
);
</script>
