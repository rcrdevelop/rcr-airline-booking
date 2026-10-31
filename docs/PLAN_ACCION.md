# Plan de Acción #07: Sistema de Búsqueda y Reserva de Vuelos (Aerolínea)

- **Componente actual en Portafolio:** `src/pages/projects/components/AirlineSystem.vue`
- **Subdominio objetivo:** `flights.rcrdevelop.com` (o `airline-booking-rcr.web.app`)
- **Stack Original Declarado:** React + Node.js + MongoDB
- **Stack Real en Firebase:** React (Vite SPA) o Vue 3 SPA en Firebase Hosting + Cloud Firestore (Bloqueo de Asientos en Tiempo Real) + Generador de Boarding Pass QR (`qrcode` + `pdf-lib`)

---

## 1. Análisis de Limitantes Técnicas en Firebase y Solución Arquitectónica

| Limitante Técnica                                                                       | Impacto Real                                                                                                                                                                                     | Solución para Firebase + Subdominio                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Concurrencia al seleccionar el mismo asiento (`12A`) entre dos usuarios simultáneos** | En un sistema real de reservas, dos personas no pueden comprar el mismo asiento al mismo tiempo.                                                                                                 | Usar **Transacciones Atómicas de Firestore (`runTransaction`)** junto con un bloqueo temporal de asiento (`seatLocks: { "12A": { lockedByUid, expiresAt } }`) y un listener `onSnapshot` que muestra en tiempo real en el mapa del avión cuando otro usuario selecciona un asiento. |
| **Paginación con filtros combinados en Firestore**                                      | Firestore requiere índices compuestos (`firestore.indexes.json`) cuando combinas igualdad (`origin == 'JFK'`, `destination == 'LAX'`) con ordenamiento por precio o salida (`orderBy('price')`). | Declarar los índices compuestos en `firestore.indexes.json` y usar cursores reales (`startAfter(lastVisibleDoc)`) para demostrar paginación de alto rendimiento en la base de datos.                                                                                                |
| **APIs globales de vuelos (Amadeus / Skyscanner) tienen cuotas estrictas**              | Las APIs GDS reales tienen límites bajos en modo gratuito o requieren credenciales comerciales.                                                                                                  | Crear un **Generador Determinístico de Rutas y Tarifas** para cualquier par de aeropuertos del mundo + opción de conectar con **Amadeus Self-Service API (Test Environment)** vía Cloud Function.                                                                                   |

---

## 2. Arquitectura de Datos en Firestore

```text
flights/{flightId}
  ├── { flightNumber: "SK-402", airline: "SkyAir", origin: "JFK", destination: "LAX", departureTime, arrivalTime, basePrice: 299, totalSeats: 120, occupiedSeats: ["1A", "3C", "12F"], seatLocks: {} }
bookings/{bookingId}
  └── { pnrCode: "RCR89X", flightId, passenger: { name, passport, email }, seatNumber: "14A", class: "Economy"|"Business", extras: ["CarryOn", "Priority"], totalPaid: 344, qrData, status: "Confirmed" }
```

---

## 3. Plan de Implementación Paso a Paso

### Fase 1: Motor de Búsqueda, Filtros y Paginación Avanzada (Semana 1)

1. **Buscador Inteligente de Vuelos**:
   - Autocompletado de aeropuertos con código IATA (`JFK - New York`, `LAX - Los Angeles`, `MAD - Madrid`, `BOG - Bogotá`), ida y vuelta, número de pasajeros y cabina.
2. **Filtros y Paginación Real**:
   - Filtro por escalas (Directo / 1 Escala), aerolínea, horario de salida, rango de precios y paginación por cursores.

### Fase 2: Mapa Interactivo de Asientos del Avión & Boarding Pass (Semana 2)

1. **Selector Visual de Cabina (Seat Map SVG/Grid)**:
   - Esquema de avión con filas Ejecutiva (`2-2`) y Económica (`3-3`), mostrando asientos disponibles, ocupados y seleccionados en tiempo real.
2. **Emisión de Reserva (PNR) y Pase de Abordar con QR**:
   - Generación de código de reserva único de 6 caracteres (ej. `RCR74K`), tarjeta de embarque visual con código QR verificable y descarga en PDF, más buscador _"Gestionar mi Reserva / Check-in"_ usando el código PNR.

### Fase 3: Despliegue en Subdominio (`flights.rcrdevelop.com`)

1. Desplegar el frontend en el target `flights` de Firebase Hosting.
2. Incluir índices compuestos en `firestore.indexes.json` para que todas las consultas filtradas funcionen sin errores.

---

## 4. Estrategia de Monetización (Template vs SaaS)

### Opción A: Venta como Template de Reservas / Ticketing ($69 - $159 USD)

- El mapa interactivo de selección de asientos + generador de Boarding Pass con QR sirve para **aerolíneas regionales, empresas de autobuses interurbanos, ferris, trenes turísticos y eventos con asientos numerados**.

### Opción B: SaaS de Reservas para Transporte Terrestre / Charter / Tours ($49 - $129 USD/mes)

- Las pequeñas empresas de transporte turístico, vans ejecutivas, lanchas y vuelos charter no tienen sistemas modernos con selección de asiento y boleto QR. Puedes venderles esta misma plataforma en marca blanca.
