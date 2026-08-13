"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LocationMapPicker.module.css";

const DEFAULT_POSITION = { lat: 25.5941, lng: 85.1376 };

const getLocationName = (item) => {
  const address = item?.address || {};
  return address.neighbourhood
    || address.suburb
    || address.road
    || address.village
    || address.city
    || address.town
    || item?.name
    || "Selected location";
};

export default function LocationMapPicker({ address, lat, lng, onSelect }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [query, setQuery] = useState(address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapStatus, setMapStatus] = useState("loading");

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { if (address && address !== query) setQuery(address); }, [address]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await response.json();
      const fullAddress = data?.display_name || `${latitude}, ${longitude}`;
      setQuery(fullAddress);
      onSelectRef.current({
        addressName: getLocationName(data),
        address: fullAddress,
        lat: latitude,
        long: longitude,
      });
    } catch {
      onSelectRef.current({ address: `${latitude}, ${longitude}`, lat: latitude, long: longitude });
    }
  };

  useEffect(() => {
    let disposed = false;
    let retryTimer;

    const initializeMap = () => {
      if (disposed || !mapElementRef.current) return;
      if (!window.L) {
        retryTimer = window.setTimeout(initializeMap, 100);
        return;
      }

      try {
        const L = window.L;
        const initialLat = Number(lat) || DEFAULT_POSITION.lat;
        const initialLng = Number(lng) || DEFAULT_POSITION.lng;
        const map = L.map(mapElementRef.current, { center: [initialLat, initialLng], zoom: 14 });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });
        map.on("click", (event) => {
          marker.setLatLng(event.latlng);
          reverseGeocode(event.latlng.lat, event.latlng.lng);
        });
        mapRef.current = map;
        markerRef.current = marker;
        setMapStatus("ready");
        [0, 150, 500].forEach((delay) => window.setTimeout(() => map.invalidateSize(), delay));
      } catch (error) {
        console.error("Unable to initialize location map:", error);
        setMapStatus("error");
      }
    };

    initializeMap();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([latitude, longitude]);
    mapRef.current.setView([latitude, longitude], 15);
  }, [lat, lng]);

  useEffect(() => {
    if (query.trim().length < 3 || query === address) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [address, query]);

  const selectSuggestion = (item) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    const fullAddress = item.display_name || query;
    setQuery(fullAddress);
    setSuggestions([]);
    markerRef.current?.setLatLng([latitude, longitude]);
    mapRef.current?.setView([latitude, longitude], 15);
    onSelect({ addressName: getLocationName(item), address: fullAddress, lat: latitude, long: longitude });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <i className="fa-solid fa-magnifying-glass" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search address or select it on the map" />
        {searching && <i className="fa-solid fa-spinner fa-spin" />}
      </div>
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((item) => (
            <button type="button" key={item.place_id} onClick={() => selectSuggestion(item)}>
              <strong>{getLocationName(item)}</strong>
              <span>{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
      <div ref={mapElementRef} className={styles.map} />
      {mapStatus === "loading" && <div className={styles.mapMessage}><i className="fa-solid fa-spinner fa-spin" /> Loading map...</div>}
      {mapStatus === "error" && <button type="button" className={styles.mapMessage} onClick={() => window.location.reload()}><i className="fa-solid fa-rotate-right" /> Reload map</button>}
    </div>
  );
}
