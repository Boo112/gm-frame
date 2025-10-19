"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Динамические импорты react-leaflet без SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

type GM = {
  lat: number;
  lng: number;
  signature: string;
};

export default function Page() {
  const [gms, setGms] = useState<GM[]>([]);
  const [markerIcon, setMarkerIcon] = useState<any>(null);

  useEffect(() => {
    // Сообщаем SDK, что приложение готово
    sdk.actions.ready();

    // Загружаем Leaflet только на клиенте
    import("leaflet").then((L) => {
      const icon = new L.Icon({
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setMarkerIcon(icon);
    });
  }, []);

  const sendGM = async () => {
    try {
      // Получаем геопозицию пользователя
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;

      // Создаем сообщение и подписываем кошельком
      const message = `GM from ${latitude},${longitude}`;
      const signature = await (sdk.wallet as any).signMessage(message);

      // Добавляем GM на карту
      setGms((prev) => [...prev, { lat: latitude, lng: longitude, signature }]);
      console.log("GM sent:", message, signature);
    } catch (err) {
      console.error("Failed to send GM:", err);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>GM Frame Mini App</h1>
      <button
        onClick={sendGM}
        style={{ padding: "0.5rem 1rem", fontSize: "1rem", marginBottom: "1rem" }}
      >
        GM!
      </button>

      {markerIcon && (
        <MapContainer
          center={[0, 0]}
          zoom={2}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {gms.map((gm, idx) => (
            <Marker key={idx} position={[gm.lat, gm.lng]} icon={markerIcon}>
              <Popup>
                {gm.signature.slice(0, 20)}… <br />
                Lat: {gm.lat}, Lng: {gm.lng}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
