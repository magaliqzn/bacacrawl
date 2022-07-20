'use strict';

class Baccaro {
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

class Bar extends Baccaro {
  type = 'bar';

  constructor(coords, spent, distance, time) {
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

class Club extends Baccaro {
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
const containerBaccaros = document.querySelector('.baccaros');
const inputType = document.querySelector('.form__input--type');
const inputSpent = document.querySelector('.form__input--spent');
const inputDistance = document.querySelector('.form__input--distance');
const inputTime = document.querySelector('.form__input--time');
const inputEntrence = document.querySelector('.form__input--entrence');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #baccaros = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newBaccaro.bind(this));
    inputType.addEventListener('change', this._toggleEntrence);
    containerBaccaros.addEventListener('click', this._moveToPopup.bind(this));
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

    this.#baccaros.forEach(bac => {
      this._renderBaccaroMarker(bac);
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

  _newBaccaro(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const spent = +inputSpent.value;
    const distance = +inputDistance.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let baccaro;

    // If baccaro bar, create bar object
    if (type === 'bar') {
      const time = +inputTime.value;

      // Check if data is valid
      if (
        !validInputs(spent, distance, time) ||
        !allPositive(spent, distance, time)
      )
        return alert('Inputs have to be positive numbers!');

      baccaro = new Bar([lat, lng], spent, distance, time);
    }

    // If baccaro club, create club object
    if (type === 'club') {
      const entrence = +inputEntrence.value;

      if (
        !validInputs(spent, distance, entrence) ||
        !allPositive(spent, distance)
      )
        return alert('Inputs have to be positive numbers!');

      baccaro = new Club([lat, lng], spent, distance, entrence);
    }

    // Add new object to baccaro array
    this.#baccaros.push(baccaro);

    // Render baccaro on map as marker
    this._renderBaccaroMarker(baccaro);

    // Render baccaro on list
    this._renderBaccaro(baccaro);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all baccaros
    this._setLocalStorage();
  }

  _renderBaccaroMarker(baccaro) {
    L.marker(baccaro.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${baccaro.type}-popup`,
        })
      )
      .setPopupContent(
        `${baccaro.type === 'bar' ? '🍻' : '💃'} ${baccaro.description}`
      )
      .openPopup();
  }

  _renderBaccaro(baccaro) {
    let html = `
      <li class="baccaro baccaro--${baccaro.type}" data-id="${baccaro.id}">
        <h2 class="baccaro__title">${baccaro.description}</h2>
        <div class="baccaro__details">
          <span class="baccaro__icon">${
            baccaro.type === 'bar' ? '🍻' : '💃'
          }</span>
          <span class="baccaro__value">${baccaro.spent}</span>
          <span class="baccaro__unit">euros</span>
        </div>
        <div class="baccaro__details">
          <span class="baccaro__icon">🚶‍♂️</span>
          <span class="baccaro__value">${baccaro.distance}</span>
          <span class="baccaro__unit">Km</span>
        </div>
    `;

    if (baccaro.type === 'bar')
      html += `
      
        <div class="baccaro__details">
          <span class="baccaro__icon">⌛</span>
          <span class="baccaro__value">${baccaro.time}</span>
          <span class="baccaro__unit">min</span>
        </div>
      </li>
      `;

    if (baccaro.type === 'club')
      html += `
     
        <div class="baccaro__details">
          <span class="baccaro__icon">🎫</span>
          <span class="baccaro__value">${baccaro.entrence}</span>
          <span class="baccaro__unit">euros</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    // BUGFIX: When i click on a baccaro before the map has loaded, i get an error.
    if (!this.#map) return;

    const baccaroEl = e.target.closest('.baccaro');

    if (!baccaroEl) return;

    const baccaro = this.#baccaros.find(bac => bac.id === baccaroEl.dataset.id);

    this.#map.setView(baccaro.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        distance: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('baccaros', JSON.stringify(this.#baccaros));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('baccaros'));

    if (!data) return;

    this.#baccaros = data;

    this.#baccaros.forEach(bac => {
      this._renderBaccaro(bac);
    });
  }

  reset() {
    localStorage.removeItem('baccaros');
    location.reload();
  }
}

const app = new App();
