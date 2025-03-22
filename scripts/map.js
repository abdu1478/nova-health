export default class Map {
  #map;
  #mapEvent;

  constructor() {
    this.#map = null;
    this.#mapEvent = null;
  }

  async init(coords) {
    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    L.marker(coords).addTo(this.#map).bindPopup('Your location').openPopup();
  }

  onMapClick(handler) {
    this.#map.on('click', handler);
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'Running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.type} on ${
          workout.description
        }`
      )
      .openPopup();
  }

  moveToPopup(coords) {
    this.#map.setView(coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
}
