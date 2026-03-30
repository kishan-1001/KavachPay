import axios from 'axios';

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const AQI_API_KEY = process.env.AQI_API_KEY || '';

interface WeatherResult {
  precipitation: number;
  temp: number;
  description: string;
}

interface NewsResult {
  count: number;
  headlines: string[];
}

interface AQIResult {
  aqi: number;
  description: string;
}

export async function getCityCoordinates(city: string) {
  try {
    const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
    if (res.data.results && res.data.results.length > 0) {
      return { 
        lat: res.data.results[0].latitude, 
        lon: res.data.results[0].longitude 
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function getRealWeather(lat: number, lon: number): Promise<WeatherResult | null> {
  try {
    const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code`);
    const current = res.data.current;
    
    return {
      precipitation: current.precipitation || 0,
      temp: current.temperature_2m,
      description: `Code ${current.weather_code}`
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

export async function getRealNews(city: string): Promise<NewsResult | null> {
  if (!NEWS_API_KEY) return null;
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`https://newsapi.org/v2/everything?q=${city}+flood+OR+rain+OR+heavy+OR+disruption+OR+smog+OR+pollution&from=${today}&sortBy=relevancy&apiKey=${NEWS_API_KEY}`);
    
    return {
      count: res.data.totalResults || 0,
      headlines: res.data.articles ? res.data.articles.slice(0, 3).map((a: any) => a.title) : []
    };
  } catch (error) {
    console.error('NewsAPI error:', error);
    return null;
  }
}

export async function getAQIData(city: string): Promise<AQIResult | null> {
  if (!AQI_API_KEY) return null;
  try {
    const res = await axios.get(`https://api.waqi.info/feed/${city}/?token=${AQI_API_KEY}`);
    if (res.data.status === 'ok') {
      return {
        aqi: res.data.data.aqi,
        description: `AQI ${res.data.data.aqi}`
      };
    }
    return null;
  } catch (error) {
    console.error('AQICN error:', error);
    return null;
  }
}

export async function calculateConsensus(city: string) {
  const coords = await getCityCoordinates(city);
  if (!coords) return null;

  const [weather, news, aqi] = await Promise.all([
    getRealWeather(coords.lat, coords.lon),
    getRealNews(city),
    getAQIData(city)
  ]);

  let disruptionScore = 0.05; // Base
  let evidence = [];

  // Weather Scoring
  if (weather) {
    if (weather.precipitation > 0.5) disruptionScore += 0.3; // Light rain
    if (weather.precipitation > 5.0) disruptionScore += 0.5; // Heavy rain
    evidence.push(`Weather: ${weather.precipitation}mm precipitation recorded via Open-Meteo.`);
  }

  // News Scoring
  if (news && news.count > 0) {
    disruptionScore += Math.min(news.count * 0.1, 0.4);
    evidence.push(`News: ${news.count} related reports found in ${city} via NewsAPI.`);
  }

  // AQI Scoring (User threshold 200)
  if (aqi) {
    if (aqi.aqi > 150) disruptionScore += 0.4;
    if (aqi.aqi > 200) disruptionScore += 0.6; // hazardous
    evidence.push(`AQI: ${aqi.aqi} (Air Quality Index) recorded via AQICN.`);
  }

  return {
    disruptionScore: parseFloat(Math.min(disruptionScore, 1.0).toFixed(2)),
    evidence: evidence.join(' | '),
    raw: { weather, news, aqi }
  };
}
