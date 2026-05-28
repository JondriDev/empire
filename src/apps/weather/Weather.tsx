import { useState, useEffect } from 'react'
import { CloudSun, Settings, RefreshCw, Thermometer, Droplets, Wind, AlertCircle } from 'lucide-react'
import { emit } from '../../lib/eventBus'

const WEATHER_CONFIG_KEY = 'empire-weather-config'
const DEMO_DATA = {
  temp: 72,
  condition: 'Sunny',
  humidity: 45,
  windSpeed: 12,
  location: 'Demo Location',
  description: 'Clear skies with perfect weather'
}

interface WeatherConfig {
  apiKey: string
  location: string
  useDemo: boolean
}

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  windSpeed: number
  location: string
  description: string
  isLoading?: boolean
  error?: string
}

export default function Weather() {
  const [config, setConfig] = useState<WeatherConfig>(() => {
    const saved = localStorage.getItem(WEATHER_CONFIG_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return { apiKey: '', location: 'Auto', useDemo: true }
  })
  
  const [weather, setWeather] = useState<WeatherData>(DEMO_DATA)
  const [showSettings, setShowSettings] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')
  const [tempLocation, setTempLocation] = useState('')

  useEffect(() => {
    emit({ type: 'APP_OPENED', appId: 'weather' })
    fetchWeather()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchWeather = async () => {
    setWeather(prev => ({ ...prev, isLoading: true, error: undefined }))
    
    try {
      if (config.useDemo || !config.apiKey) {
        // Use demo data with slight randomization for realism
        const demoVariation = {
          ...DEMO_DATA,
          temp: DEMO_DATA.temp + Math.floor(Math.random() * 5) - 2,
          isLoading: false
        }
        setWeather(demoVariation)
        emit({ type: 'WEATHER_UPDATED', ...demoVariation })
        return
      }

      // OpenWeatherMap API call
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(config.location || 'London')}&appid=${config.apiKey}&units=imperial`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const weatherData: WeatherData = {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 2.236), // m/s to mph
        location: data.name,
        description: data.weather[0].description,
        isLoading: false
      }
      
      setWeather(weatherData)
      emit({ type: 'WEATHER_UPDATED', ...weatherData })
    } catch (error: unknown) {
    console.error('Weather fetch error:', error)
    setWeather(_prev => ({
      ...DEMO_DATA,
      error: error instanceof Error ? error.message : 'Failed to fetch weather',
      isLoading: false
    }))
    }
  }

  const handleSaveConfig = () => {
    const newConfig: WeatherConfig = {
      apiKey: tempApiKey,
      location: tempLocation || 'London',
      useDemo: !tempApiKey
    }
    setConfig(newConfig)
    localStorage.setItem(WEATHER_CONFIG_KEY, JSON.stringify(newConfig))
    setShowSettings(false)
    fetchWeather()
  }

  const handleRefresh = () => {
    fetchWeather()
  }

  const conditionIcon = () => {
    switch (weather.condition?.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <CloudSun className="w-16 h-16 text-yellow-400" />
      case 'cloudy':
      case 'overcast':
        return <CloudSun className="w-16 h-16 text-gray-400" />
      case 'rain':
      case 'drizzle':
        return <Droplets className="w-16 h-16 text-blue-400" />
      case 'snow':
        return <CloudSun className="w-16 h-16 text-white" />
      case 'thunderstorm':
        return <AlertCircle className="w-16 h-16 text-yellow-600" />
      default:
        return <CloudSun className="w-16 h-16 text-blue-300" />
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            {conditionIcon()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{weather.location}</h1>
            <p className="text-sm text-gray-400 capitalize">{weather.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${weather.isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setTempApiKey(config.apiKey)
              setTempLocation(config.location)
              setShowSettings(true)
            }}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Temperature Card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Temperature</span>
          </div>
          <div className="text-4xl font-light">{weather.isLoading ? '...' : `${weather.temp}°F`}</div>
        </div>

        {/* Condition Card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Condition</span>
          </div>
          <div className="text-lg font-medium">{weather.isLoading ? '...' : weather.condition}</div>
        </div>

        {/* Humidity Card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Humidity</span>
          </div>
          <div className="text-2xl font-light">{weather.isLoading ? '...' : `${weather.humidity}%`}</div>
        </div>

        {/* Wind Card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ background: 'var(--card-bg)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-gray-400">Wind</span>
          </div>
          <div className="text-2xl font-light">{weather.isLoading ? '...' : `${weather.windSpeed} mph`}</div>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {config.useDemo && (
        <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-xs text-yellow-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Demo mode active. Add your OpenWeatherMap API key in settings for live data.</span>
        </div>
      )}

      {/* Error Display */}
      {weather.error && (
        <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{weather.error}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowSettings(false)}>
        <div className="w-full max-w-md rounded-2xl border border-white/10 p-6" style={{ background: 'var(--card-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4" /> Weather Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">OpenWeatherMap API Key (optional)</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={e => setTempApiKey(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
                  placeholder="Leave empty for demo mode"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Get a free key at <a href="https://openweathermap.org/api" target="_blank" className="text-blue-400 hover:underline">openweathermap.org</a>
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Location</label>
                <input
                  value={tempLocation}
                  onChange={e => setTempLocation(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ background: 'var(--input-bg)', color: 'var(--text)' }}
                  placeholder="London"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
