import Map from './map.js';
import Storage from './storage.js';
import Running from './running.js';
import Cycling from './cycling.js';
import { validateInputs, allPositive } from './utils.js';

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
    this.#workouts = Storage.getWorkouts();
    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
      this.#map.renderWorkoutMarker(workout);
    });

    // Attach event listeners
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  async _getPosition() {
    if (navigator.geolocation) {
      try {
        const position = await this._getCurrentPositionAsync();
        this.#map = new Map();
        await this.#map.init([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        this.#map.onMapClick(this._showForm.bind(this));
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
        timeout: 5000,
        maximumAge: 0, // Do not use a cached location
      });
    });
  }

  //   Form handler
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // Select option handler
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //   New workout handler

  _newWorkout(e) {
    e.preventDefault();

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
        !validateInputs(distance, duration, cadence) ||
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
        !validateInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new workout to the array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this.#map.renderWorkoutMarker(workout);
    this._renderWorkout(workout);

    // Clear form fields and hide form
    form.classList.add('hidden');
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    Storage.saveWorkouts(this.#workouts);
  }

  //   Workout that is displayed on the side bar
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

    this.#map.moveToPopup(workout.coords);
  }
}

const app = new App();
