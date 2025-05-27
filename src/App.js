// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css'; // Make sure you have this file for basic styling

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [city, setCity] = useState('London'); // Default city
  const [inputCity, setInputCity] = useState('London');
  const [currentWeatherData, setCurrentWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]); // For forecast data (WeatherAPI.com)
  const [error, setError] = useState(null);

  // Get the API key from environment variables
  const API_KEY = process.env.REACT_APP_WEATHERAPI_KEY;

  // Function to fetch weather data (current and forecast)
  const fetchWeatherData = async (selectedCity) => {
    // Basic validation for API key
    if (!API_KEY) {
      setError("API Key is missing. Please set REACT_APP_WEATHERAPI_KEY in your .env file.");
      return;
    }

    // Clear previous states
    setError(null);
    setCurrentWeatherData(null);
    setForecastData([]);

    // WeatherAPI.com URL for current and forecast (up to 10 days in free tier)
    // We are requesting 7 days of forecast.
    const URL = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${selectedCity}&days=7`;

    try {
      const response = await axios.get(URL);
      const data = response.data;

      // Set current weather data
      setCurrentWeatherData(data.current);

      // Set forecast data (array of daily forecast objects)
      setForecastData(data.forecast.forecastday);

    } catch (err) {
      // Improved error handling based on WeatherAPI.com's error response structure
      setError(
        (err.response && err.response.data && err.response.data.error && err.response.data.error.message) ||
        err.message ||
        "An unknown error occurred while fetching weather data."
      );
      setCurrentWeatherData(null);
      setForecastData([]);
    }
  };

  // useEffect hook to fetch data when the component mounts or city/API_KEY changes
  useEffect(() => {
    fetchWeatherData(city);
  }, [city, API_KEY]); // Dependency array: re-run if 'city' or 'API_KEY' changes

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setCity(inputCity); // Update the 'city' state, which triggers the useEffect
  };

  // Prepare data for Chart.js
  const chartData = {
    labels: forecastData.map(day => day.date), // Dates for the X-axis
    datasets: [
      {
        label: 'Avg. Temperature (°F)',
        data: forecastData.map(day => day.day.avgtemp_f), // Average temperature for each day
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4, // Makes the line curved
        pointRadius: 5,
        pointBackgroundColor: 'rgb(75, 192, 192)',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
      },
      {
        label: 'Max Temperature (°F)',
        data: forecastData.map(day => day.day.maxtemp_f),
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
      },
      {
        label: 'Min Temperature (°F)',
        data: forecastData.map(day => day.day.mintemp_f),
        fill: false,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(54, 162, 235)',
        pointBorderColor: '#fff',
        pointHoverRadius: 7,
      }
    ],
  };

  // Options for the Chart.js graph
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows you to control size with CSS
    plugins: {
      legend: {
        position: 'top',
        labels: {
            font: {
                size: 14
            }
        }
      },
      title: {
        display: true,
        text: `7-Day Temperature Forecast for ${city}`,
        font: {
            size: 18
        },
        padding: {
            top: 10,
            bottom: 30
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `${context.parsed.y}°F`;
            }
            return label;
          }
        }
      }
    },
    scales: {
        y: {
            beginAtZero: false,
            title: {
                display: true,
                text: 'Temperature (°F)',
                font: {
                    size: 16
                }
            },
            grid: {
                color: 'rgba(200, 200, 200, 0.2)'
            }
        },
        x: {
            title: {
                display: true,
                text: 'Date',
                font: {
                    size: 16
                }
            },
            grid: {
                color: 'rgba(200, 200, 200, 0.2)'
            }
        }
    }
  };

  return (
    <div className="App">
      <h1>Weather Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputCity}
          onChange={(e) => setInputCity(e.target.value)}
          placeholder="Enter city"
        />
        <button type="submit">Get Weather</button>
      </form>

      {/* Display error messages if any */}
      {error && <div className="error-message">{error}</div>}

      {/* Display current weather data */}
      {currentWeatherData && (
        <div className="weather-card">
          <h2>Current Weather in {city}</h2>
          <p>Temperature: {currentWeatherData.temp_f}°F</p>
          <p>Condition: {currentWeatherData.condition.text}</p>
          <p>Humidity: {currentWeatherData.humidity}%</p>
          <p>Wind: {currentWeatherData.wind_mph} mph ({currentWeatherData.wind_dir})</p>
          <img src={currentWeatherData.condition.icon} alt={currentWeatherData.condition.text} />
        </div>
      )}

      {/* Display forecast chart if data is available */}
      {forecastData.length > 0 && (
        <div className="chart-container">
          {/* We'll use a fixed height for the chart container for better visibility */}
          <div style={{ height: '400px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;