"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Иконка для маркеров на карте
const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type GMData = { lat: number; lng: number; signature: string };

export default function Home() {
  const [gms, setGms] = useState<GMData[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const sendGM = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;

      const message = `GM from ${latitude},${longitude}`;
      const signature = await sdk.wallet.signMessage(message);

      setGms((prev) => [...prev, { lat: latitude, lng: longitude, signature }]);
      console.log("GM sent:", message, signature);
    } catch (err) {
      setError("Ошибка при отправке GM: " + (err as any).message);
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>GM Frame Mini App</h1>
      <button onClick={sendGM} style={{ padding: "10px 20px", fontSize: 18 }}>
        GM!
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2 style={{ marginTop: 30 }}>Карта GM</h2>
      <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {gms.map((gm, idx) => (
          <Marker key={idx} position={[gm.lat, gm.lng]} icon={markerIcon}>
            <Popup>
              {gm.signature.slice(0, 20)}… <br /> Lat: {gm.lat}, Lng: {gm.lng}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}