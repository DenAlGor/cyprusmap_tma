import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cities, City } from './cities';
import { motion, AnimatePresence } from 'motion/react';

// Исправляем иконки Leaflet для React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Типизация для Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

export default function App() {
  const [score, setScore] = useState(0);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [isGreek, setIsGreek] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const tg = window.Telegram?.WebApp;

  const nextQuestion = useCallback(() => {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    setCurrentCity(randomCity);
    setIsGreek(Math.random() > 0.5);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
    }
    nextQuestion();
  }, [tg, nextQuestion]);

  const handleMarkerClick = (clickedCity: City) => {
    if (!currentCity) return;

    if (clickedCity.nameRu === currentCity.nameRu) {
      setScore(prev => prev + 10);
      setFeedback('success');
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      // Небольшая задержка перед следующим вопросом для визуального фидбека
      setTimeout(nextQuestion, 1000);
    } else {
      setFeedback('error');
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
      // Сбрасываем статус ошибки через секунду
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--tg-theme-bg-color,#f5f5f5)] text-[var(--tg-theme-text-color,#000)] overflow-hidden font-sans">
      {/* Шапка с вопросом */}
      <header className="p-4 text-center bg-[var(--tg-theme-secondary-bg-color,#fff)] shadow-md z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCity?.nameRu}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center"
          >
            <span className="text-sm uppercase tracking-wider opacity-60 mb-1">
              Где находится?
            </span>
            <h1 className="text-2xl font-bold text-[var(--tg-theme-button-color,#3390ec)]">
              {isGreek ? currentCity?.nameEl : currentCity?.nameRu}
            </h1>
          </motion.div>
        </AnimatePresence>
      </header>

      {/* Карта */}
      <div className="relative flex-grow">
        <MapContainer
          center={[35.0, 33.3]}
          zoom={8}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {cities.map((city) => (
            <Marker
              key={city.nameRu}
              position={city.coords}
              eventHandlers={{
                click: () => handleMarkerClick(city),
              }}
            />
          ))}
        </MapContainer>

        {/* Информационные плашки поверх карты */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-lg border border-white/10">
            <span className="text-xs uppercase opacity-70 block">Очки</span>
            <span className="text-xl font-mono font-bold">{score}</span>
          </div>
        </div>

        {/* Фидбек */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`absolute inset-0 flex items-center justify-center z-[2000] pointer-events-none`}
            >
              <div className={`px-8 py-4 rounded-3xl text-white font-bold text-2xl shadow-2xl backdrop-blur-sm ${
                feedback === 'success' ? 'bg-emerald-500/80' : 'bg-rose-500/80'
              }`}>
                {feedback === 'success' ? 'Верно! +10' : 'Попробуй еще раз'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Подвал */}
      <footer className="p-2 text-center text-[10px] opacity-40 bg-[var(--tg-theme-bg-color,#f5f5f5)]">
        Cyprus Map Quiz TMA • {cities.length} локаций
      </footer>
    </div>
  );
}
