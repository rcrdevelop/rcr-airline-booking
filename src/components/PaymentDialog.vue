<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <q-card style="max-width: 420px; width: 100%">
      <q-card-section class="row items-center">
        <div class="text-h6">Pago seguro</div>
        <q-space />
        <q-icon name="lock" color="positive" />
      </q-card-section>
      <q-separator />

      <q-card-section class="q-gutter-sm">
        <q-banner dense class="bg-grey-2 text-dark rounded-borders">
          Demo: usa cualquier tarjeta, no se realiza ningún cargo.
        </q-banner>
        <q-input
          v-model="cardName"
          label="Titular de la tarjeta"
          filled
          dense
          autocomplete="cc-name"
        />
        <q-input
          v-model="cardNumber"
          label="Número de tarjeta"
          filled
          dense
          mask="#### #### #### ####"
          autocomplete="cc-number"
        >
          <template v-slot:append><q-icon name="credit_card" /></template>
        </q-input>
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="expiry"
            label="Caducidad MM/AA"
            filled
            dense
            mask="##/##"
            class="col-6"
          />
          <q-input
            v-model="cvv"
            label="CVV"
            filled
            dense
            mask="###"
            type="password"
            class="col-6"
          />
        </div>
        <q-checkbox v-model="terms" dense>
          <div class="text-caption">
            Acepto los términos y condiciones del billete y la política de
            privacidad.
          </div>
        </q-checkbox>
        <div class="row text-h6 text-bold"
          ><span>Total a pagar</span><q-space /><span
            >${{ amount.toFixed(2) }}</span
          ></div
        >
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          no-caps
          label="Volver"
          :disable="processing"
          v-close-popup
        />
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="lock"
          :label="`Pagar $${amount.toFixed(2)}`"
          :loading="processing"
          :disable="!valid"
          @click="pay"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{ modelValue: boolean; amount: number }>();
const emit = defineEmits<{
  "update:modelValue": [v: boolean];
  paid: [];
}>();

const cardName = ref("");
const cardNumber = ref("");
const expiry = ref("");
const cvv = ref("");
const terms = ref(false);
const processing = ref(false);

const valid = computed(
  () =>
    cardName.value.trim().length > 2 &&
    cardNumber.value.replace(/\s/g, "").length === 16 &&
    expiry.value.length === 5 &&
    cvv.value.length === 3 &&
    terms.value
);

watch(
  () => props.modelValue,
  v => {
    if (v) processing.value = false;
  }
);

function pay() {
  processing.value = true;
  setTimeout(() => {
    processing.value = false;
    emit("paid");
    emit("update:modelValue", false);
  }, 1400);
}
</script>
