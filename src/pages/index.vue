<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-white text-dark">
      <q-toolbar>
        <q-toolbar-title class="row items-center q-gutter-sm">
          <q-icon name="flight_takeoff" color="primary" />
          <span class="text-bold">SkyBook</span>
          <q-badge color="primary" label="demo" />
        </q-toolbar-title>

        <q-tabs shrink stretch active-color="primary">
          <q-route-tab to="/" label="Vuelos" icon="search" exact />
          <q-route-tab
            to="/gestionar"
            label="Mi reserva"
            icon="confirmation_number"
            exact
          />
          <q-route-tab
            to="/estado"
            label="Estado"
            icon="flight_takeoff"
            exact
          />
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark text-white">
      <div class="row q-pa-lg q-col-gutter-md">
        <div class="col-12 col-sm-4">
          <div class="row items-center q-gutter-sm q-mb-xs">
            <q-icon name="flight_takeoff" color="white" />
            <span class="text-bold">SkyBook</span>
          </div>
          <div class="text-caption text-grey-5">
            Sistema demo de búsqueda y reserva de vuelos con selección de
            asiento y pase de abordar QR.
          </div>
        </div>
        <div class="col-6 col-sm-4">
          <div class="text-subtitle2 q-mb-xs">Compañía</div>
          <div class="text-caption text-grey-5 foot-link">Sobre nosotros</div>
          <div class="text-caption text-grey-5 foot-link">Flota</div>
          <div class="text-caption text-grey-5 foot-link">Destinos</div>
          <div class="text-caption text-grey-5 foot-link">Empleo</div>
        </div>
        <div class="col-6 col-sm-4">
          <div class="text-subtitle2 q-mb-xs">Ayuda</div>
          <div class="text-caption text-grey-5 foot-link">
            <router-link to="/gestionar" class="foot-link"
              >Gestionar reserva</router-link
            >
          </div>
          <div class="text-caption text-grey-5 foot-link">
            <router-link to="/estado" class="foot-link"
              >Estado del vuelo</router-link
            >
          </div>
          <div class="text-caption text-grey-5 foot-link"
            >Política de equipaje</div
          >
          <div class="text-caption text-grey-5 foot-link"
            >Términos y condiciones</div
          >
        </div>
      </div>
      <q-separator dark />
      <div class="text-center text-caption text-grey-6 q-pa-sm">
        © 2026 SkyBook · Demo para portafolio — no realiza reservas reales
      </div>
    </q-footer>
  </q-layout>
</template>

<style scoped>
.foot-link {
  color: #94a3b8;
  text-decoration: none;
  line-height: 1.8;
  cursor: pointer;
}
.foot-link:hover {
  color: #fff;
}
</style>
