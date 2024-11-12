import { getLocation } from './geolocation.js';
import i18n from './i18n.js';
import { showBotFeedback } from './ui.js';

const proxyUrl = "https://outfit-checker-proxy.vercel.app";

class WeatherHandler {
    constructor(proxyUrl) {
        this.proxyUrl = proxyUrl;
        this.weatherContainer = document.getElementById('weather-container');
        this.forecastContainer = document.getElementById('hourly-forecast');
    }

    async displayDailyWeather(onForecastClickCallback) {
        const weatherInfo = await this.#getWeather();

        const currentWeather = weatherInfo.currentWeather;
        const forecast = weatherInfo.forecast;

        const times = {
            [i18n.getText('morning')]: '06:00',
            [i18n.getText('noon')]: '12:00',
            [i18n.getText('evening')]: '18:00',
            [i18n.getText('night')]: '00:00'
        };

        this.forecastContainer.innerHTML = '';

        this.#showWeatherElement(currentWeather, i18n.getText('current_weather'), onForecastClickCallback, true);

        const currentHour = new Date().getHours();

        const sortedTimes = Object.entries(times).sort(([keyA, timeA], [keyB, timeB]) => {
            const hourA = parseInt(timeA.split(':')[0]);
            const hourB = parseInt(timeB.split(':')[0]);

            return (hourA >= currentHour ? hourA : hourA + 24) - (hourB >= currentHour ? hourB : hourB + 24);
        });

        sortedTimes.forEach(([timeOfDay, targetTime]) => {

            const weatherData = this.#getWeatherForTime(forecast.list, targetTime);

            this.#showWeatherElement(weatherData, timeOfDay, onForecastClickCallback);
        });

        return weatherInfo;
    }

    toggleWeatherVisibility() {
        const isVisible = this.weatherContainer.style.display === 'block';
        this.weatherContainer.style.display = isVisible ? 'none' : 'block';
    }

    async #getWeather(retryButton) {
        const { lat, lon } = await getLocation(retryButton);
        try {
            const [currentWeatherData, forecastWeatherData] = await Promise.all([
                this.#fetchWeatherData(lat, lon, 'current'),
                this.#fetchWeatherData(lat, lon, 'forecast')
            ]);

            return {
                currentWeather: currentWeatherData,
                forecast: forecastWeatherData
            };
        } catch (error) {
            console.error('Error retrieving weather data:', error);
            showBotFeedback(i18n.getText('error'));
            throw error;
        }
    }

    async #fetchWeatherData(lat, lon, type) {
        const response = await fetch(`${this.proxyUrl}/api/proxyWeather.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon, type })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${type} weather data`);
        }

        return await response.json();
    }

    #getWeatherForTime(hourlyData, targetTime) {
        return hourlyData.find((hour) => {
            const timeString = hour.dt_txt.split(' ')[1];
            const hourString = timeString.substring(0, 5);
            return hourString === targetTime;
        });
    }


    #showWeatherElement(weatherData, title, onForecastClickCallback, highlight = false) {
        const forecastItem = document.createElement('div');
        forecastItem.className = weatherData ? (highlight ? 'forecast-item active' : 'forecast-item') : 'forecast-item';

        if (!weatherData) {
            forecastItem.innerHTML = `
        <h3>${title}</h3>
        <span>${i18n.getText('no_weather_data_available')}</span>
      `;
        } else {
            const temp = weatherData.main.temp.toFixed(1);
            const weatherDescription = weatherData.weather[0].description;
            const icon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;

            forecastItem.innerHTML = `
        <h3>${title}</h3>
        <span>${temp}°C</span>
        <img src="${icon}" alt="${weatherDescription}">
        <span>${weatherDescription}</span>
      `;

            forecastItem.addEventListener('click', async () => {
                this.#handleForecastItemClick(forecastItem, weatherData, onForecastClickCallback);
            });
        }

        this.forecastContainer.appendChild(forecastItem);
    }

    async #handleForecastItemClick(forecastItem, weatherData, onClickCallback) {
        document.querySelectorAll('.forecast-item').forEach(item => item.classList.remove('active'));
        forecastItem.classList.add('active');
        showBotFeedback(i18n.getText('new_forecast_wait_for_assistant'));
        await onClickCallback.call(this, weatherData);
    }
}

// Instantiate and use the WeatherService class
const weatherHandler = new WeatherHandler(proxyUrl);

export { weatherHandler };
