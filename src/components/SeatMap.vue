<template>
  <div class="plane">
    <div class="nose" />
    <div class="legend row justify-center q-gutter-md q-mb-sm">
      <span><i class="sq free" /> Libre</span>
      <span><i class="sq sel" /> Seleccionado</span>
      <span><i class="sq occ" /> Ocupado</span>
      <span><i class="sq lock" /> Otro usuario</span>
    </div>

    <div class="rows">
      <div
        v-for="r in seatRows()"
        :key="r.row"
        class="seat-row"
        :class="{ biz: r.business, off: !rowAllowed(r.row, cabin) }"
      >
        <span class="rownum">{{ r.row }}</span>
        <div class="seats">
          <template v-for="(l, i) in seatsForRow(r.row)" :key="l">
            <div v-if="aisleAfter(r.row, i)" class="aisle" />
            <div
              class="seat"
              :class="seatClass(`${r.row}${l}`, r.business, r.row)"
              @click="pick(`${r.row}${l}`, r.row)"
            >
              {{ l }}
            </div>
          </template>
        </div>
        <span class="rownum">{{ r.row }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { rowAllowed, seatRows, seatsForRow } from "@/lib/flights";

const props = withDefaults(
  defineProps<{
    occupied: Set<string>;
    selected: string[];
    locked?: Set<string>;
    cabin?: string;
  }>(),
  { cabin: "Economy" }
);
const emit = defineEmits<{ select: [seat: string] }>();

const lockedSeats = computed(() => props.locked ?? new Set<string>());

function aisleAfter(row: number, i: number): boolean {
  return row <= 3 ? i === 1 : i === 2;
}
function seatClass(seat: string, business: boolean, row: number) {
  const allowed = rowAllowed(row, props.cabin);
  return {
    business,
    occ: props.occupied.has(seat),
    sel: props.selected.includes(seat),
    lock: lockedSeats.value.has(seat) && !props.occupied.has(seat),
    free: allowed && !props.occupied.has(seat) && !lockedSeats.value.has(seat),
    off: !allowed
  };
}
function pick(seat: string, row: number) {
  if (!rowAllowed(row, props.cabin)) return;
  if (props.occupied.has(seat) || lockedSeats.value.has(seat)) return;
  emit("select", seat);
}
</script>

<style scoped>
.plane {
  background: #f1f5f9;
  border-radius: 120px 120px 40px 40px;
  padding: 60px 24px 30px;
  max-width: 420px;
  margin: 0 auto;
  border: 2px solid #cbd5e1;
}
.nose {
  width: 90px;
  height: 26px;
  border-radius: 50%;
  background: #cbd5e1;
  margin: -40px auto 30px;
}
.legend {
  font-size: 11px;
  color: #475569;
}
.sq {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: -2px;
}
.sq.free {
  background: #fff;
  border: 1px solid #94a3b8;
}
.sq.sel {
  background: #1d4ed8;
}
.sq.occ {
  background: #94a3b8;
}
.sq.lock {
  background: #f59e0b;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 420px;
  overflow-y: auto;
}
.seat-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.seat-row.biz {
  margin-bottom: 6px;
}
.seat-row.off .seat {
  opacity: 0.35;
  cursor: not-allowed;
}
.rownum {
  width: 18px;
  font-size: 10px;
  color: #94a3b8;
  text-align: center;
}
.seats {
  display: flex;
  gap: 5px;
}
.aisle {
  width: 18px;
}
.seat {
  width: 34px;
  height: 34px;
  border-radius: 8px 8px 4px 4px;
  background: #fff;
  border: 1px solid #94a3b8;
  font-size: 11px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.seat.business {
  border-color: #b45309;
}
.seat.occ {
  background: #94a3b8;
  color: #64748b;
  cursor: not-allowed;
}
.seat.lock {
  background: #f59e0b;
  color: #fff;
  cursor: not-allowed;
}
.seat.sel {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #fff;
  transform: scale(1.12);
}
</style>
