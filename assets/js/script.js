import { loadLanguage, changeLanguage, getText } from './i18n.js';
import { CameraError, GeolocationPermissionError } from './errors.js';

const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const video = document.getElementById('video');
const videoOverlay = document.getElementById('video-overlay');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const bubbleMsg = document.getElementById('bubbleMessage');
const retryButton = document.getElementById('retryButton');
const showWeatherButton = document.getElementById('weather-toggle-button');
const weatherContainer = document.getElementById('weather-container');
const forecastContainer = document.getElementById('hourly-forecast');

let lastOutfitAnalysis;

const savedLang = localStorage.getItem('language');
const userLang = savedLang || navigator.language.slice(0, 2);
loadLanguage(userLang === 'de' ? 'de' : 'en');

document.getElementById('languageSelect').value = userLang === 'de' ? 'de' : 'en';

document.getElementById('languageSelect').addEventListener('change', (event) => {
  const selectedLanguage = event.target.value;
  localStorage.setItem('language', selectedLanguage);
  changeLanguage(selectedLanguage);
});


const proxyUrl = "https://outfit-checker-proxy.vercel.app"
//const proxyUrl = "http://localhost:3000";

async function testProxy() {
  try {
    const response = await fetch('https://outfit-checker-proxy.vercel.app/api/proxyTest.js', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Fehler! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Antwort vom Proxy:', data);
  } catch (error) {
    console.error('Fehler bei der Anfrage:', error);
  }
}

if (isDevelopment) {
  testProxy();
}

retryButton.addEventListener('click', () => {
  retryButton.style.display = "none";
  checkOutfit();
});

function handleCameraError(error) {
  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    console.error("Camera access denied by the user.");
    showBotFeedback(getText('camera_permission_denied_response')); // TODO: show button to allow access
    retryButton.style.display = 'block'
  } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    console.error("No camera found.");
    showBotFeedback(getText('camera_not_found_response'));
  } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
    console.error("Constraints cannot be satisfied by any available camera.");
    showBotFeedback(getText('camera_constrained_not_satisfied_response'));
  } else {
    console.error("An unknown error occurred while accessing the camera:", error);
    showBotFeedback(getText('error'));
  }
}


async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoOverlay.style.opacity = '0';
    video.srcObject = stream;
    return stream;
  } catch (error) {
    handleCameraError(error);
    throw new CameraError("Camera error.");
  }
}

function stopCamera(stream) {
  const tracks = stream.getTracks();
  tracks.forEach(track => track.stop());
}

function startCountdown(callback) {
  let countdownValue = 5;
  let countdown = setInterval(() => {
    if (countdownValue > 0) {
      countdownValue--;
      showBotFeedback(getText('countdown_message', { count: countdownValue }));
    } else {
      clearInterval(countdown);
      callback()
    }
  }, 1000);
}

function takePicture() {
  const context = canvas.getContext('2d');

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.error("Video element is not ready.");
    return null;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg');
}

function drawImageOnCanvas(imageData) {
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const img = new Image();
  img.onload = function () {
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = imageData;
}

function takePictureWithAnimation(stream) {
  return new Promise((resolve) => {
    let captureAnimation = document.createElement('div');
    captureAnimation.id = 'captureAnimation';
    document.body.appendChild(captureAnimation);
    captureAnimation.style.display = 'block';

    setTimeout(async () => {
      const imageData = takePicture();
      captureAnimation.style.display = 'none';
      showBotFeedback(getText('imageTaken'));

      video.style.display = 'none';
      canvas.style.display = 'block';

      drawImageOnCanvas(imageData);

      stopCamera(stream);

      resolve(imageData);

    }, 300);
  });
}

async function captureImageWithCountdown() {
  let stream = await startCamera();

  video.style.display = 'block';
  canvas.style.display = 'none';

  const imageData = await new Promise((resolve) => {
    startCountdown(() => {
      takePictureWithAnimation(stream).then((imageData) => {
        resolve(imageData);
      });
    });
  });
  return imageData;
}

function parseOutfitResult(results, threshold = 0.05, k_max = 5) {
  const classes = results[0].entities[0].classes;

  const sortedClasses = Object.entries(classes).sort((a, b) => b[1] - a[1]);

  const filteredClasses = sortedClasses.filter(([className, probability]) => probability > threshold);

  const limitedClasses = filteredClasses.slice(0, Math.min(k_max, filteredClasses.length));

  let description = getText('outfit_description');

  limitedClasses.forEach(([className, probability], index) => {
    description += getText('outfit_item', {
      item: className,
      probability: (probability * 100).toFixed(2)
    });
  });

  return description;
}

async function analyzeOutfit(imageData) {
  if (isDevelopment) {
    console.log("Entwicklungsmodus erkannt: Verwende Mock Response.");
    const mockResponse = {
      results: [
        {
          status: {
            code: "ok",
            message: "Success"
          },
          name: "image.jpg",
          md5: "6ea449c4645b8811eef1342040725687",
          width: 1024,
          height: 768,
          entities: [
            {
              kind: "classes",
              name: "fashion-classes",
              classes: {
                "top, t-shirt, sweatshirt": 0.044,
                "outwear": 0.008,
                "vest": 0.335,
                "shorts": 0.009
              }
            }
          ]
        }
      ]
    };
    const outfit_description = parseOutfitResult(mockResponse.results);

    return outfit_description;
  }

  const response = await fetch(`${proxyUrl}/api/proxyOutfit.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageData }),
  });

  const fashionApiData = await response.json();

  if (fashionApiData.message && fashionApiData.message.includes('You have exceeded the MONTHLY quota')) {
    console.log("Quota exceeded. Switching to Llama 3.2");

    const prompt = "What's in this image? Describe the outfit."

    // Anfrage an den neuen Proxy für Llama 3.2
    const llamaResponse = await fetch(`${proxyUrl}/api/proxyLlmVision.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData }),
    });

    const llamaData = await llamaResponse.json();
    const llamaAnswer = llamaData.choices[0].message.content
    console.log(`Llama-Vision answer: ${llamaAnswer}`);
    return llamaAnswer;
  }

  const outfit_description = parseOutfitResult(data.results);

  return outfit_description;
}

showWeatherButton.addEventListener('click', () => {
  const isVisible = weatherContainer.style.display === 'block';
  weatherContainer.style.display = isVisible ? 'none' : 'block';
}); 

async function getWeather() {
  const { lat, lon } = await getLocation();

  try {
    const currentResponse = await fetch(`${proxyUrl}/api/proxyWeather.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat,
        lon,
        type: 'current'
      }),
    });

    const forecastResponse = await fetch(`${proxyUrl}/api/proxyWeather.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat,
        lon,
        type: 'forecast'
      }),
    });

    const [currentWeatherData, forecastWeatherData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json()
    ]);

    const combinedData = {
      currentWeather: currentWeatherData,
      forecast: forecastWeatherData,   
    };

    return combinedData;
  } catch (error) {
    console.error('Fehler beim Abrufen der Wetterdaten:', error);
    throw error; // Fehler weitergeben
  }
}


function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (position) {
        const currentPosition = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        resolve(currentPosition);
      }, function (error) {
        if (error.code === error.PERMISSION_DENIED) {
          showBotFeedback(getText('geolocation_permission_denied_response'));
          retryButton.style.display = 'block'
          reject(new GeolocationPermissionError("Geolocation permission was denied."));
        } else {
          reject("Geolocation error: " + error.message);
        }
      });
    } else {
      reject("Geolocation is not supported.");
    }
  });
}

async function checkOutfitWithLLM(outfitAnalysis, weatherInfo) {
  const prompt = getText('weather_prompt', {
    weatherDescription: weatherInfo.weather[0].description,
    temperature: weatherInfo.main.temp,
    outfit: outfitAnalysis
  });
  console.log(prompt)
  const response = await fetch(`${proxyUrl}/api/proxyLLM.js`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  return data;
}

function showBotFeedback(message) {
  bubbleMsg.textContent = message;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkPermissions() {
  try {
    const cameraPermission = await navigator.permissions.query({ name: 'camera' });
    const cameraGranted = cameraPermission.state === 'granted';

    const locationPermission = await navigator.permissions.query({ name: 'geolocation' });
    const locationGranted = locationPermission.state === 'granted';

    return cameraGranted && locationGranted;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

function showWeatherElement(weatherData, title, highlight = false) {
  if(!weatherData) {
    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <h3>${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}</h3>
      <span>${getText('no_weather_data_available')}</span>
    `;
    forecastContainer.appendChild(forecastItem);
  }

  const temp = weatherData.main.temp.toFixed(1);
  const weatherDescription = weatherData.weather[0].description;
  const icon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`;

  const forecastItem = document.createElement('div');
  if(highlight) {
    forecastItem.className = 'forecast-item active';
  } else {
    forecastItem.className = 'forecast-item';
  }
  forecastItem.innerHTML = `
    <h3>${title}</h3>
    <span>${temp}°C</span>
    <img src="${icon}" alt="${weatherDescription}">
    <span>${weatherDescription}</span>
  `;

  forecastItem.addEventListener('click', async () => {
    document.querySelectorAll('.forecast-item').forEach(item => item.classList.remove('active'));
    forecastItem.classList.add('active');
    showBotFeedback(getText('new_forecast_wait_for_assistant'));
    const feedback = await checkOutfitWithLLM(lastOutfitAnalysis, weatherData);
    showBotFeedback(feedback);
  });

  forecastContainer.appendChild(forecastItem);
}

function getWeatherForTime(hourlyData, targetTime) {
  return hourlyData.find((hour) => {
    const timeString = hour.dt_txt.split(' ')[1]; 
    const hourString = timeString.substring(0, 5); 
    return hourString === targetTime;
  });
}

function displayDailyWeather(weatherInfo) {
  const currentWeather = weatherInfo.currentWeather;
  const forecast = weatherInfo.forecast;

  const times = {
    [getText('morning')]: '06:00',
    [getText('noon')]: '12:00',
    [getText('evening')]: '18:00',
    [getText('night')]: '00:00'
  };
  
  forecastContainer.innerHTML = '';

  showWeatherElement(currentWeather, getText('current_weather'), true);

  const currentHour = new Date().getHours();

  const sortedTimes = Object.entries(times).sort(([keyA, timeA], [keyB, timeB]) => {
    const hourA = parseInt(timeA.split(':')[0]);
    const hourB = parseInt(timeB.split(':')[0]);

    return (hourA >= currentHour ? hourA : hourA + 24) - (hourB >= currentHour ? hourB : hourB + 24);
  });

  sortedTimes.forEach(([timeOfDay, targetTime]) => {

    const weatherData = getWeatherForTime(forecast.list, targetTime); 

    showWeatherElement(weatherData, timeOfDay);
  });
}

async function checkOutfit() {
  if (!(await checkPermissions())) {
    showBotFeedback(getText('request_permissions'));

    await sleep(1000);
  }

  let imageData;
  try {
    imageData = await captureImageWithCountdown();
  } catch (error) {
    if (error instanceof CameraError) {
      return;
    }
    throw error;
  }
  lastOutfitAnalysis = await analyzeOutfit(imageData);
  let weatherInfo;
  try {
    weatherInfo = await getWeather();
    displayDailyWeather(weatherInfo);
    showWeatherButton.style.display = "block";  
  }catch (error) {
    if (error instanceof GeolocationPermissionError) {
      return;
    }
    throw error;
  }
  const feedback = await checkOutfitWithLLM(lastOutfitAnalysis, weatherInfo.currentWeather);

  showBotFeedback(feedback);
}

captureBtn.addEventListener('click', checkOutfit);
