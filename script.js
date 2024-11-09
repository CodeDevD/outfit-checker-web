const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const feedbackDiv = document.getElementById('feedback');
const captureBtn = document.getElementById('captureBtn');

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

  testProxy();
  

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
}

startCamera();

function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

function parseOutfitResult(results, threshold = 0.05, k_max = 5) {
  const classes = results[0].entities[0].classes;
  
  const sortedClasses = Object.entries(classes).sort((a, b) => b[1] - a[1]);
  
  const filteredClasses = sortedClasses.filter(([className, probability]) => probability > threshold);
  
  const limitedClasses = filteredClasses.slice(0, Math.min(k_max, filteredClasses.length));

  let description = "Das Outfit besteht aus:\n";
  
  limitedClasses.forEach(([className, probability], index) => {
    description += `- ${className} mit einer Wahrscheinlichkeit von ${(probability * 100).toFixed(2)}%\n`;
  });

  return description;
}


  

// Outfit analysieren
async function analyzeOutfit(imageData) {
    console.log(window.location.hostname)
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

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

    if (isDevelopment) {
        console.log("Entwicklungsmodus erkannt: Verwende Mock Response.");
        const outfit_description = parseOutfitResult(mockResponse.results);

        console.log("Outfit analysis result:");
        console.log(outfit_description);
    
        return outfit_description;
    }

    // Führe den API-Aufruf aus
    const response = await fetch(`${proxyUrl}/api/proxyOutfit.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }), 
    });
    
    const data = await response.json();

    const outfit_description = parseOutfitResult(data.results);

    console.log("Outfit analysis result:");
    console.log(outfit_description);

    return outfit_description;
}

async function getWeather() {
    const { lat, lon } = await getLocation();

    const response = await fetch(`${proxyUrl}/api/proxyWeather.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon }),
      });
    
    const weatherData = await response.json();
    return weatherData;
}

function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const currentPosition = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                resolve(currentPosition); // Standort zurückgeben
            }, function(error) {
                reject("Fehler bei der Geolokalisierung: " + error.message);
            });
        } else {
            reject("Geolokalisierung wird nicht unterstützt.");
        }
    });
}

async function checkOutfitWithLLM(outfitAnalysis, weatherInfo) {
    const prompt = `Das aktuelle Wetter ist ${weatherInfo.weather[0].description} mit ${weatherInfo.main.temp}°C. Der Benutzer trägt: ${outfitAnalysis}. Passt dieses Outfit zum Wetter?`;
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

async function checkOutfit() {
    feedbackDiv.textContent = "Analyse läuft...";

    const imageData = captureImage();
    const outfitAnalysis = await analyzeOutfit(imageData);
    console.log(outfitAnalysis)
    const weatherInfo = await getWeather();
    const feedback = await checkOutfitWithLLM(outfitAnalysis, weatherInfo);

    feedbackDiv.textContent = feedback;
}

captureBtn.addEventListener('click', checkOutfit);
