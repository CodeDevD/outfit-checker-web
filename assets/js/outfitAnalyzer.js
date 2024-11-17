import i18n from './i18n.js';
import { isDevelopment, proxyUrl } from './config.js';

class OutfitAnalyzer {
  #threshold = 0.05;
  #maxItems = 5;
  #proxyUrl = `${proxyUrl}/api`;

  constructor() {
    
  }

  // Analyze an outfit image
  async analyzeOutfit(imageData) {
    if (isDevelopment) {
      console.log("Development mode detected: Using mock response.");
      return this.#parseMockResponse();
    }

    try {
      const fashionApiData = await this.#fetchFashionApiData(imageData);

      if (fashionApiData.message && fashionApiData.message.includes('You have exceeded the MONTHLY quota')) {
        console.log("Quota exceeded. Switching to Llama 3.2");
        return await this.#fetchLlamaResponse(imageData);
      }

      return this.#parseOutfitResult(fashionApiData.results);
    } catch (error) {
      console.error("Error analyzing outfit:", error);
      return i18n.getText('error_message');
    }
  }

  async generateLlmResponseForOutfit(outfitAnalysis, weatherInfo) {
    const prompt = i18n.getText('weather_prompt', {
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

  // Fetch fashion API data
  async #fetchFashionApiData(imageData) {
    const response = await fetch(`${this.#proxyUrl}/proxyOutfit.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    if (!response.ok) {
      throw new Error(`Fashion API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Fetch response from Llama 3.2 API
  async #fetchLlamaResponse(imageData) {
    const prompt = "What's in this image? Describe the outfit.";

    const llamaResponse = await fetch(`${this.#proxyUrl}/proxyLlmVision.js`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData }),
    });

    if (!llamaResponse.ok) {
      throw new Error(`Llama API request failed: ${llamaResponse.statusText}`);
    }

    const llamaData = await llamaResponse.json();
    const llamaAnswer = llamaData.choices[0]?.message?.content || i18n.getText('error_message');
    console.log(`Llama-Vision answer: ${llamaAnswer}`);

    return llamaAnswer;
  }

  // Parse mock response in development mode
  #parseMockResponse() {
    const mockResponse = {
      results: [
        {
          status: {
            code: "ok",
            message: "Success",
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
                "shorts": 0.009,
              },
            },
          ],
        },
      ],
    };

    return this.#parseOutfitResult(mockResponse.results);
  }

  // Parse the outfit result
  #parseOutfitResult(results) {
    const classes = results[0]?.entities[0]?.classes || {};

    // Sort classes by probability in descending order
    const sortedClasses = Object.entries(classes).sort((a, b) => b[1] - a[1]);

    // Filter classes by threshold and limit the number of items
    const filteredClasses = sortedClasses.filter(([className, probability]) => probability > this.#threshold);
    const limitedClasses = filteredClasses.slice(0, this.#maxItems);

    // Construct the outfit description
    let description = i18n.getText('outfit_description');

    limitedClasses.forEach(([className, probability]) => {
      description += i18n.getText('outfit_item', {
        item: className,
        probability: (probability * 100).toFixed(2),
      });
    });

    return description;
  }
}

const outfitAnalyzer = new OutfitAnalyzer(isDevelopment);
export default outfitAnalyzer;
