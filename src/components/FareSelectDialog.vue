<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <q-card style="max-width: 720px; width: 100%">
      <q-card-section class="row items-center">
        <div>
          <div class="text-h6">Elige tu tarifa</div>
          <div class="text-caption text-grey-7">
            {{ legLabel }} · {{ flight?.origin }} → {{ flight?.destination }} ·
            {{ flight?.airline }} {{ flight?.number }}
          </div>
        </div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div v-for="f in FARES" :key="f.id" class="col-12 col-sm-4">
            <q-card
              flat
              bordered
              class="fare cursor-pointer"
              :class="{ recommended: f.id === 'classic' }"
              @click="pick(f)"
            >
              <q-card-section>
                <div class="row items-center">
                  <div class="text-subtitle1 text-bold">{{ f.label }}</div>
                  <q-space />
                  <q-badge
                    v-if="f.id === 'classic'"
                    color="primary"
                    label="Popular"
                  />
                </div>
                <div class="text-h5 text-primary text-bold q-mt-xs"
                  >${{ price(f) }}</div
                >
                <div class="text-caption text-grey-7">por pasajero</div>
              </q-card-section>
              <q-separator />
              <q-list dense class="q-py-sm">
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="work" size="xs"
                  /></q-item-section>
                  <q-item-section class="text-caption">{{
                    f.carryOn
                  }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="luggage" size="xs"
                  /></q-item-section>
                  <q-item-section class="text-caption">{{
                    f.checked
                  }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon name="airline_seat_recline_normal" size="xs"
                  /></q-item-section>
                  <q-item-section class="text-caption">{{
                    f.seatPick
                  }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon
                      :name="f.changeable ? 'check' : 'close'"
                      size="xs"
                      :color="f.changeable ? 'positive' : 'negative'"
                  /></q-item-section>
                  <q-item-section class="text-caption">{{
                    f.changeable ? "Cambios permitidos" : "Sin cambios"
                  }}</q-item-section>
                </q-item>
                <q-item>
                  <q-item-section avatar
                    ><q-icon
                      :name="f.refundable ? 'check' : 'close'"
                      size="xs"
                      :color="f.refundable ? 'positive' : 'negative'"
                  /></q-item-section>
                  <q-item-section class="text-caption">{{
                    f.refundable ? "Reembolsable" : "No reembolsable"
                  }}</q-item-section>
                </q-item>
              </q-list>
              <q-card-actions>
                <q-btn
                  color="primary"
                  unelevated
                  no-caps
                  class="full-width"
                  :label="`Elegir ${f.label}`"
                  @click.stop="pick(f)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { FARES, cabinMult } from "@/lib/flights";
import type { Fare, Flight } from "@/lib/flights";

const props = defineProps<{
  modelValue: boolean;
  flight: Flight | null;
  cabin: string;
  legLabel: string;
}>();
const emit = defineEmits<{
  "update:modelValue": [v: boolean];
  select: [fare: Fare];
}>();

function price(f: Fare): string {
  const p = (props.flight?.price ?? 0) * cabinMult(props.cabin) * f.mult;
  return p.toFixed(0);
}
function pick(f: Fare) {
  emit("select", f);
  emit("update:modelValue", false);
}
</script>

<style scoped>
.fare {
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}
.fare:hover {
  transform: translateY(-3px);
  border-color: var(--q-primary);
}
.fare.recommended {
  border-color: var(--q-primary);
}
</style>
