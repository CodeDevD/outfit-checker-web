# Outfit Checker

**Outfit Checker** is a web-based application that allows users to analyze their outfits in real-time using their webcam and provides weather-based outfit recommendations. This project is part of the MoCIoT (Mobile Computing and IoT) submission by Daniel Kosin.

---

## Table of Contents
1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Code Structure](#code-structure)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Future Improvements](#future-improvements)
7. [License](#license)

---

## Features

- **Live Outfit Capture**: Captures images of the user using their webcam.
- **Weather-Based Recommendations**: Fetches real-time weather data to provide clothing suggestions.
- **Outfit Analysis**: Analyzes the captured outfit to suggest enhancements or ensure appropriateness.
- **Multi-language Support**: Includes translations for a global audience using the `i18next` library.
- **Responsive Design**: Optimized for both desktop and mobile platforms.

---

## Technology Stack

The following technologies and libraries were used in this project:

- **HTML5/CSS3/JavaScript**: Core web development technologies.
- **Bootstrap**: For responsive and visually appealing design.
- **jQuery**: Simplifies DOM manipulation and AJAX requests.
- **WebRTC**: Accesses the user's webcam for image capture.
- **OpenWeatherMap API**: Provides real-time weather data for recommendations.
- **i18next**: Implements multi-language support for user interfaces.
- **Custom CSS**: Adds unique styling and overrides default styles.

---

## Code Structure

Here is a brief overview of the codebase:

### HTML
- **index.html**: The main page that includes the webcam functionality and interactive elements.
- **about.html**: A separate page providing details about the project and its purpose.

### CSS
- **styles.css**: Contains custom styles for the application, including the layout of the webcam interface and other UI elements.

### JavaScript

- **`app.js`**:
  - Handles core functionalities, including:
    - Webcam initialization and image capture using `camera.js`.
    - Integration with the weather and outfit analysis features.
    - Managing the UI interactions for feedback and retry actions.

- **`camera.js`**:
  - Encapsulates all logic related to camera control:
    - Accessing the user's webcam using WebRTC.
    - Capturing images and rendering them to a canvas.

- **`outfitAnalyzer.js`**:
  - Processes captured images to analyze outfits.
  - Integrates outfit analysis with weather conditions for personalized recommendations.
  - Generates feedback using advanced algorithms.

- **`weather.js`**:
  - Fetches real-time weather data using the OpenWeatherMap API.
  - Displays daily and hourly forecasts.
  - Provides an interactive way to see weather-dependent recommendations.

- **`i18n.js`**:
  - Implements multi-language support using the `i18next` library.
  - Manages translations for UI elements and dynamically updates them based on the selected language.

- **`permissions.js`**:
  - Checks and manages user permissions for accessing the webcam and geolocation.
  - Provides error handling for denied or revoked permissions.

- **`geolocation.js`**:
  - Handles geolocation functionality to retrieve the user's current location.
  - Works with the `weather.js` script to fetch location-based weather data.
  - Provides error handling for geolocation-specific issues.

- **`ui.js`**:
  - Manages UI-specific logic, including:
    - Displaying bot feedback messages.

- **`errors.js`**:
  - Defines custom error classes (e.g., `GeolocationPermissionError`, `CameraError`) for structured error handling throughout the application.

- **`config.js`**:
  - Stores application-level configurations, such as default settings, and environment flags.

- **`proxyTest.js`**:
  - Tests the backend proxy functionality (if applicable) to ensure the application can communicate with APIs or services.


### Assets
- **images/**: Contains icons and images used in the UI.
- **i18n/**: Stores translation JSON files for multi-language support.

---

## Installation

1. Clone this repository:
    ```bash
    git clone https://github.com/CodeDevD/outfit-checker.git
    ```
2. Navigate to the project directory:
    ```bash
    cd outfit-checker
    ```
3. Open `index.html` in your browser to launch the application.

---

## Usage

1. Launch the application in a browser.
2. Allow webcam access when prompted.
3. Click on the **Capture** button to take an image.
4. View outfit recommendations based on the current weather.
5. Clck on the weather button to use forecast weather informations.
6. Navigate to the "About" section to learn more about the project.

