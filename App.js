'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const cycling = 'cycling';

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._init();
  }
  async _init() {
    await this._getPosition();

    // Get data from local storage
    await this._getLocalStorage();

    // Attach event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  async _getPosition() {
    if (navigator.geolocation) {
      try {
        const position = await this._getCurrentPositionAsync();
        this._loadMap(position);
      } catch (error) {
        alert('Could not get your position. Please enable location services.');
        console.error(error);
      }
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  _getCurrentPositionAsync() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000, // Wait up to 5 seconds
        maximumAge: 0, // Do not use a cached location
      });
    });
  }

  async _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const cords = [latitude, longitude];

    // Initialize the map
    this.#map = L.map('map').setView(cords, 15);

    // Add tile layer
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    // Add marker for user's location
    L.marker(cords).addTo(this.#map).bindPopup('Your location').openPopup();

    // Log Google Maps URL
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    // Handle map click event
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Helper functions for validation
    const allPositive = (...inputs) => inputs.every(input => input > 0);
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    // Get form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, create running object
    if (type === 'Running') {
      const cadence = +inputCadence.value;

      // Validate data
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, create cycling object
    if (type === 'Cycling') {
      const elevation = +inputElevation.value;

      // Validate data
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new workout to the array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);

    // Clear form fields and hide form
    form.classList.add('hidden');
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
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
          workout.discription
        }`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    const html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'Running' ? '🏃‍♂️' : '🚴‍♂️'
            } </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === 'Running'
                ? Math.round(workout.pace)
                : Math.round(workout.speed)
            }</span>
            <span class="workout__unit">${
              workout.type === 'Running' ? 'MIN/KM' : 'KM/H'
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'Running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value">${
              workout.type === 'Running'
                ? workout.cadence
                : workout.elevationGain
            }</span>
            <span class="workout__unit">${
              workout.type === 'Running' ? 'SPM' : 'M'
            }</span>
          </div>
        </li>
    `;
    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  async _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      this._renderWorkoutMarker(work);
    });
  }
}

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _showWorkout() {
    console.log(this);
  }
  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'Running';
  constructor(cords, distance, duration, cadence, pace) {
    super(cords, distance, duration);
    this.cadence = cadence;
    this.pace = pace;
    this.calcPace();
    this._setDiscription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'Cycling';
  constructor(cords, distance, duration, elevationGain, speed) {
    super(cords, distance, duration);
    this.elevationGain = elevationGain;
    this.speed = speed;
    this.calcSpeed();
    this._setDiscription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const app = new App();
