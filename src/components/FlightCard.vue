<template>
  <q-card flat bordered class="q-mb-sm flight">
    <q-card-section class="row items-center">
      <div class="col-12 col-sm-2">
        <div class="text-subtitle2">{{ flight.airline }}</div>
        <div class="text-caption text-grey-6">{{ flight.number }}</div>
        <div class="text-caption text-grey-6">{{ flight.aircraft }}</div>
      </div>
      <div class="col-6 col-sm-4">
        <div class="row items-center q-gutter-sm">
          <div
            ><div class="text-h6">{{ fmtTime(flight.departure) }}</div
            ><div class="text-caption">{{ flight.origin }}</div></div
          >
          <div class="col text-center">
            <div class="text-caption text-grey-6">{{
              fmtDur(flight.durationMin)
            }}</div>
            <q-separator />
            <div
              class="text-caption"
              :class="flight.stops ? 'text-warning' : 'text-positive'"
            >
              {{ flight.stops ? `1 escala · ${flight.stopOver}` : "Directo" }}
            </div>
          </div>
          <div
            ><div class="text-h6">{{ fmtTime(flight.arrival) }}</div
            ><div class="text-caption">{{ flight.destination }}</div></div
          >
        </div>
      </div>
      <div class="col-6 col-sm-3 text-right">
        <q-badge
          v-if="flight.cabin === 'Business'"
          color="purple-8"
          label="Business"
          class="q-mr-xs"
        />
        <div class="text-h5 text-bold text-primary">${{ price }}</div>
        <div class="text-caption text-grey-6">desde · por pasajero</div>
      </div>
      <div class="col-12 col-sm-3 text-right">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Detalles"
          icon="info"
          @click="emit('details')"
        />
        <q-btn
          color="primary"
          unelevated
          no-caps
          label="Seleccionar"
          @click="emit('select')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { cabinMult, fmtDur, fmtTime } from "@/lib/flights";
import type { Flight } from "@/lib/flights";

const props = defineProps<{ flight: Flight; cabin: string }>();
const emit = defineEmits<{ details: []; select: [] }>();

const price = computed(() =>
  (props.flight.price * cabinMult(props.cabin)).toFixed(0)
);
</script>

<style scoped>
.flight:hover {
  border-color: var(--q-primary);
}
</style>
