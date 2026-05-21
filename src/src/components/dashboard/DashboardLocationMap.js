import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DashboardLocationMap.css';

const bbox = require('geojson-bbox');

const ETHIOPIA_CENTER = [9.15, 38.75];
const ETHIOPIA_ZOOM = 6;

const BOUNDARY_STYLE = {
  color: '#1b4332',
  weight: 2.5,
  opacity: 0.95,
  fillColor: '#52b788',
  fillOpacity: 0.22,
};

function FitToGeo({ geoJson }) {
  const map = useMap();

  useEffect(() => {
    if (!geoJson?.features?.length) return;
    try {
      const extent = bbox(geoJson);
      const bounds = L.latLngBounds(
        [extent[1], extent[0]],
        [extent[3], extent[2]],
      );
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    } catch {
      map.setView(ETHIOPIA_CENTER, ETHIOPIA_ZOOM);
    }
  }, [geoJson, map]);

  return null;
}

function DashboardLocationMap({ geoJson, status, level, areaLabel }) {
  const mapKey = useMemo(
    () => `${level || 'none'}-${geoJson?.features?.[0]?.id ?? 'default'}`,
    [geoJson, level],
  );

  const statusMessage = (() => {
    if (status === 'loading') return 'Loading boundary…';
    if (status === 'error') return 'Map preview unavailable';
    if (status === 'empty' || status === 'idle') {
      return 'Select a region or lower unit to preview boundaries';
    }
    return null;
  })();

  return (
    <div className="dash-loc-map">
      <div className="dash-loc-map__frame">
        <MapContainer
          key={mapKey}
          center={ETHIOPIA_CENTER}
          zoom={ETHIOPIA_ZOOM}
          scrollWheelZoom
          className="dash-loc-map__leaflet"
          zoomControl
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoJson?.features?.length ? (
            <>
              <GeoJSON data={geoJson} style={BOUNDARY_STYLE} />
              <FitToGeo geoJson={geoJson} />
            </>
          ) : null}
        </MapContainer>

        {statusMessage ? (
          <div className="dash-loc-map__overlay" role="status">
            {status === 'loading' ? (
              <span className="spinner-border spinner-border-sm text-success" aria-hidden="true" />
            ) : (
              <i className="bi bi-geo-alt" aria-hidden="true" />
            )}
            <span>{statusMessage}</span>
          </div>
        ) : null}
      </div>

      {areaLabel && status === 'ready' ? (
        <p className="dash-loc-map__caption">
          <i className="bi bi-bounding-box" aria-hidden="true" />
          Showing <strong>{areaLabel}</strong>
          {level ? ` (${level})` : ''}
        </p>
      ) : null}
    </div>
  );
}

export default DashboardLocationMap;
