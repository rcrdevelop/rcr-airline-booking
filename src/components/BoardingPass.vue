<template>
  <div class="bp">
    <div class="bp-header">
      <div>
        <div class="bp-airline">{{
          leg?.airline ?? booking.flight.airline
        }}</div>
        <div class="bp-sub"
          >BOARDING PASS · {{ booking.cabin.toUpperCase() }}</div
        >
      </div>
      <div class="bp-pnr">{{ booking.pnr }}</div>
    </div>

    <div class="bp-body">
      <div class="bp-route">
        <div class="bp-city">
          <div class="bp-iata">{{ leg?.origin }}</div>
          <div class="bp-time">{{ fmtTime(leg?.departure ?? "") }}</div>
        </div>
        <div class="bp-plane">✈</div>
        <div class="bp-city right">
          <div class="bp-iata">{{ leg?.destination }}</div>
          <div class="bp-time">{{ fmtTime(leg?.arrival ?? "") }}</div>
        </div>
      </div>

      <div class="bp-grid">
        <div
          ><span>Pasajero</span><b>{{ passenger?.name ?? "—" }}</b></div
        >
        <div
          ><span>Vuelo</span><b>{{ leg?.number }}</b></div
        >
        <div
          ><span>Asiento</span><b class="seat">{{ seat ?? "—" }}</b></div
        >
        <div
          ><span>Estado</span><b>{{ booking.status }}</b></div
        >
      </div>
    </div>

    <div class="bp-qr">
      <img v-if="qr" :src="qr" />
      <div class="bp-sub">Escanear en puerta</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import QRCode from "qrcode";
import type { Booking, Flight } from "@/lib/flights";
import { fmtTime } from "@/lib/flights";

const props = withDefaults(
  defineProps<{ booking: Booking; index?: number; retour?: boolean }>(),
  { index: 0, retour: false }
);
const qr = ref("");

const leg = computed<Flight | undefined>(() =>
  props.retour
    ? (props.booking.returnFlight ?? undefined)
    : props.booking.flight
);
const passenger = computed(
  () => props.booking.passengers[props.index] ?? props.booking.passengers[0]
);
const seat = computed(() =>
  props.retour
    ? props.booking.returnSeats[props.index]
    : props.booking.seats[props.index]
);

onMounted(async () => {
  const payload = `RCRCHECKIN|${props.booking.pnr}|${leg.value?.number}|${seat.value}|${passenger.value?.name}`;
  qr.value = await QRCode.toDataURL(payload, { width: 150, margin: 1 });
});
</script>

<style scoped>
.bp {
  width: 340px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  font-family: "Roboto", sans-serif;
}
.bp-header {
  background: linear-gradient(120deg, #1d4ed8, #0369a1);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bp-airline {
  font-weight: 800;
  font-size: 18px;
}
.bp-sub {
  font-size: 10px;
  letter-spacing: 1.5px;
  opacity: 0.8;
}
.bp-pnr {
  background: rgba(255, 255, 255, 0.18);
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 800;
  letter-spacing: 2px;
}
.bp-body {
  padding: 18px 20px;
}
.bp-route {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px dashed #e2e8f0;
  padding-bottom: 14px;
}
.bp-iata {
  font-size: 34px;
  font-weight: 900;
  color: #0f172a;
}
.bp-time {
  color: #64748b;
  font-size: 12px;
}
.bp-city.right {
  text-align: right;
}
.bp-plane {
  font-size: 26px;
  color: #1d4ed8;
}
.bp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 14px;
}
.bp-grid span {
  display: block;
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
}
.bp-grid b {
  font-size: 14px;
  color: #0f172a;
}
.bp-grid .seat {
  color: #1d4ed8;
  font-size: 18px;
}
.bp-qr {
  padding: 16px;
  text-align: center;
  border-top: 2px dashed #e2e8f0;
}
.bp-qr img {
  width: 150px;
  height: 150px;
}
</style>
