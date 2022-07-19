'use strict';

class Vaccaro {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, spent, distance) {
    // this.date = ...
    // this.id = ...
    this.coords = coords; // [lat, lng]
    this.spent = spent;
    this.distance = distance;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Bar extends Vaccaro {
  type = 'bar';

  constructor(coords, spent, distance, Time) {
    super(coords, spent, distance);
    this.time = time;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.distance / this.spent;
    return this.pace;
  }
}

class Club extends Vaccaro {
  type = 'club';

  constructor(coords, spent, distance, entrence) {
    super(coords, spent, distance);
    this.entrence = entrence;
    // this.type = 'club';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.spent / (this.distance / 60);
    return this.speed;
  }
}

// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerVaccaros = document.querySelector('.vaccaros');
const inputType = document.querySelector('.form__input--type');
const inputSpent = document.querySelector('.form__input--spent');
const inputDistance = document.querySelector('.form__input--distance');
const inputTime = document.querySelector('.form__input--time');
const inputEntrence = document.querySelector('.form__input--entrence');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #vaccaros = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newVaccaro.bind(this));
    inputType.addEventListener('change', this._toggleEntrence);
    containerVaccaros.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#vaccaros.forEach(vac => {
      this._renderVaccaroMarker(vac);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputSpent.focus();
  }

  _hideForm() {
    // Empty inputs
    inputSpent.value =
      inputDistance.value =
      inputTime.value =
      inputEntrence.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleEntrence() {
    inputEntrence.closest('.form__row').classList.toggle('form__row--hidden');
    inputTime.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newVaccaro(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const spent = +inputSpent.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let vaccaro;

    // If vaccaro bar, create bar object
    if (type === 'bar') {
      const time = +inputTime.value;

      // Check if data is valid
      if (
        !validInputs(spent, distance, time) ||
        !allPositive(spent, distance, time)
      )
        return alert('Inputs have to be positive numbers!');

      vaccaro = new Bar([lat, lng], spent, distance, time);
    }

    // If vaccaro club, create club object
    if (type === 'club') {
      const entrence = +inputEntrence.value;

      if (
        !validInputs(spent, distance, entrence) ||
        !allPositive(spent, distance)
      )
        return alert('Inputs have to be positive numbers!');

      vaccaro = new Club([lat, lng], spent, distance, entrence);
    }

    // Add new object to vaccaro array
    this.#vaccaros.push(vaccaro);

    // Render vaccaro on map as marker
    this._renderVaccaroMarker(vaccaro);

    // Render vaccaro on list
    this._renderVaccaro(vaccaro);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all vaccaros
    this._setLocalStorage();
  }

  _renderVaccaroMarker(vaccaro) {
    L.marker(vaccaro.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${vaccaro.type}-popup`,
        })
      )
      .setPopupContent(
        `${vaccaro.type === 'bar' ? '🍻' : '💃'} ${vaccaro.description}`
      )
      .openPopup();
  }

  _renderVaccaro(vaccaro) {
    let html = `
      <li class="vaccaro vaccaro--${vaccaro.type}" data-id="${vaccaro.id}">
        <h2 class="vaccaro__title">${vaccaro.description}</h2>
        <div class="vaccaro__details">
          <span class="vaccaro__icon">${
            vaccaro.type === 'bar' ? '🍻' : '💃'
          }</span>
          <span class="vaccaro__value">${vaccaro.spent}</span>
          <span class="vaccaro__unit">euros</span>
        </div>
        <div class="vaccaro__details">
          <span class="vaccaro__icon">🚶‍♂️</span>
          <span class="vaccaro__value">${vaccaro.distance}</span>
          <span class="vaccaro__unit">Km</span>
        </div>
    `;

    if (vaccaro.type === 'bar')
      html += `
      
        <div class="vaccaro__details">
          <span class="vaccaro__icon">⌛</span>
          <span class="vaccaro__value">${vaccaro.time}</span>
          <span class="vaccaro__unit">min</span>
        </div>
      </li>
      `;

    if (vaccaro.type === 'club')
      html += `
     
        <div class="vaccaro__details">
          <span class="vaccaro__icon">🎫</span>
          <span class="vaccaro__value">${vaccaro.entrence}</span>
          <span class="vaccaro__unit">euros</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // BUGFIX: When i click on a vaccaro before the map has loaded, i get an error.
    if (!this.#map) return;

    const vaccaroEl = e.target.closest('.vaccaro');

    if (!vaccaroEl) return;

    const vaccaro = this.#vaccaros.find(vac => vac.id === vaccaroEl.dataset.id);

    this.#map.setView(vaccaro.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        distance: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('vaccaros', JSON.stringify(this.#vaccaros));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('vaccaros'));

    if (!data) return;

    this.#vaccaros = data;

    this.#vaccaros.forEach(vac => {
      this._renderVaccaro(vac);
    });
  }

  reset() {
    localStorage.removeItem('vaccaros');
    location.reload();
  }
}

const app = new App();
