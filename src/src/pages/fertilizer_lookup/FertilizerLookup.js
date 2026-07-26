import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import Configuration from '../../conf/Configuration';
import {
    buildYearOptions,
    forecastDateFromYear,
    formatCropName,
    getCropsFromDominantLayers,
    getDominantAdvisoryLayers,
    isWithinEthiopia,
    ETHIOPIA_BOUNDS,
} from '../../utils/fertilizerLayerUtils';
import {
    geolocationErrorMessage,
    isGeolocationSupported,
    requestCurrentPosition,
} from '../../utils/geolocation';
import './FertilizerLookup.css';

/* global L */

const yearOptions = buildYearOptions(2022);

function FertilizerLookup() {
    const [availableLayers, setAvailableLayers] = useState([]);
    const [year, setYear] = useState(yearOptions[0]);
    const [crop, setCrop] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingLayers, setLoadingLayers] = useState(true);
    const [error, setError] = useState('');
    const [results, setResults] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [isLocatingGps, setIsLocatingGps] = useState(false);
    const [gpsAutoEnabled, setGpsAutoEnabled] = useState(false);

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const cropOptions = useMemo(
        () => getCropsFromDominantLayers(availableLayers),
        [availableLayers]
    );

    const advisoryLayers = useMemo(
        () => getDominantAdvisoryLayers(availableLayers, crop),
        [availableLayers, crop]
    );

    useEffect(() => {
        axios
            .get(`${Configuration.get_url_api_base()}layers_fertilizer`)
            .then((response) => {
                const names =
                    response.data?.layers?.map((layer) => layer.name) || [];
                setAvailableLayers(names);
                const crops = getCropsFromDominantLayers(names);
                if (crops.length > 0) setCrop(crops[0]);
            })
            .catch((err) => {
                console.error('Error loading layers:', err);
                setError('Could not load advisory layers. Please refresh the page.');
            })
            .finally(() => setLoadingLayers(false));
    }, []);

    const syncCoordsToMarker = useCallback((latitude, longitude) => {
        if (!mapRef.current || !markerRef.current) return;
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude]);
    }, []);

    const applyCoordinatesFromPosition = useCallback((latitude, longitude) => {
        const latStr = latitude.toFixed(3);
        const lonStr = longitude.toFixed(3);
        setLat(latStr);
        setLon(lonStr);
        setResults(null);
        setError('');

        if (!mapRef.current || !isWithinEthiopia(latitude, longitude)) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
        } else {
            markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
        }
        mapRef.current.panTo([latitude, longitude]);
    }, []);

    const refreshGpsLocation = useCallback(
        async ({ cancelled = () => false, showWeakSignalWarning = true } = {}) => {
            if (!isGeolocationSupported()) {
                setError(geolocationErrorMessage('UNSUPPORTED'));
                return { success: false };
            }

            setError('');
            setResults(null);
            setIsLocatingGps(true);
            await new Promise((resolve) => setTimeout(resolve, 0));

            try {
                const position = await requestCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: gpsAutoEnabled ? 15000 : 30000,
                });

                if (cancelled()) return { success: false };

                if (!isWithinEthiopia(position.latitude, position.longitude)) {
                    setError(
                        `GPS location (${position.latitude.toFixed(3)}, ${position.longitude.toFixed(3)}) is outside Ethiopia. Turn off Use GPS and pick a point on the map.`
                    );
                    return { success: false };
                }

                applyCoordinatesFromPosition(position.latitude, position.longitude);

                if (showWeakSignalWarning && position.accuracy > 100) {
                    setError(
                        'GPS signal looks weak. Confirm the pin on the map or try again outdoors.'
                    );
                }

                return {
                    success: true,
                    lat: position.latitude,
                    lon: position.longitude,
                };
            } catch (err) {
                if (!cancelled()) {
                    setError(
                        err.message ||
                            geolocationErrorMessage(err.code) ||
                            'Could not detect your location. Turn off Use GPS to enter coordinates manually.'
                    );
                }
                return { success: false };
            } finally {
                setIsLocatingGps(false);
            }
        },
        [applyCoordinatesFromPosition, gpsAutoEnabled]
    );

    useEffect(() => {
        if (!gpsAutoEnabled) return undefined;

        let cancelled = false;

        const runAutoGps = async () => {
            await refreshGpsLocation({ cancelled: () => cancelled });
        };

        runAutoGps();
        return () => {
            cancelled = true;
        };
    }, [gpsAutoEnabled, refreshGpsLocation]);

    const initializeMap = useCallback(() => {
        if (typeof L === 'undefined' || !mapContainerRef.current || mapRef.current) {
            return;
        }

        const ethiopiaBounds = [
            [ETHIOPIA_BOUNDS.latMin, ETHIOPIA_BOUNDS.lonMin],
            [ETHIOPIA_BOUNDS.latMax, ETHIOPIA_BOUNDS.lonMax],
        ];

        const map = L.map(mapContainerRef.current, {
            maxBounds: ethiopiaBounds,
            maxBoundsViscosity: 1.0,
            minZoom: 5,
            maxZoom: 12,
        }).setView([9.0, 38.7], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            noWrap: true,
        }).addTo(map);

        L.rectangle(ethiopiaBounds, {
            color: '#2d6a4f',
            weight: 2,
            fillOpacity: 0.08,
        }).addTo(map);

        map.on('click', (e) => {
            const clickLat = e.latlng.lat;
            const clickLon = e.latlng.lng;
            if (!isWithinEthiopia(clickLat, clickLon)) return;

            setGpsAutoEnabled(false);

            if (markerRef.current) {
                markerRef.current.setLatLng([clickLat, clickLon]);
            } else {
                markerRef.current = L.marker([clickLat, clickLon]).addTo(map);
            }

            setLat(clickLat.toFixed(3));
            setLon(clickLon.toFixed(3));
            setError('');
        });

        mapRef.current = map;
        setMapReady(true);

        requestAnimationFrame(() => {
            map.invalidateSize();
        });
    }, []);

    useEffect(() => {
        initializeMap();
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
                setMapReady(false);
            }
        };
    }, [initializeMap]);

    useEffect(() => {
        if (!mapRef.current) return undefined;

        const refreshMapSize = () => {
            window.requestAnimationFrame(() => {
                mapRef.current?.invalidateSize();
            });
        };

        window.addEventListener('resize', refreshMapSize);
        window.addEventListener('orientationchange', refreshMapSize);
        return () => {
            window.removeEventListener('resize', refreshMapSize);
            window.removeEventListener('orientationchange', refreshMapSize);
        };
    }, [mapReady]);

    const handleCoordInput = (field, value) => {
        if (gpsAutoEnabled) return;

        if (field === 'lat') setLat(value);
        else setLon(value);

        const parsedLat = parseFloat(field === 'lat' ? value : lat);
        const parsedLon = parseFloat(field === 'lon' ? value : lon);

        if (
            !Number.isNaN(parsedLat) &&
            !Number.isNaN(parsedLon) &&
            isWithinEthiopia(parsedLat, parsedLon)
        ) {
            if (!markerRef.current && mapRef.current) {
                markerRef.current = L.marker([parsedLat, parsedLon]).addTo(mapRef.current);
            }
            syncCoordsToMarker(parsedLat, parsedLon);
        }
    };

    const handleGpsToggle = (enabled) => {
        setGpsAutoEnabled(enabled);
        if (!enabled) {
            setIsLocatingGps(false);
            setError('');
        }
    };

    const fetchCoordinateValue = async (layer, latitude, longitude, date) => {
        const coorStr = JSON.stringify([{ lat: latitude, lon: longitude }]);
        const response = await axios.post(
            `${Configuration.get_url_api_base()}coordinates/${layer}/${coorStr}/${date}`
        );
        if (response.data?.length > 0 && response.data[0].value != null) {
            return parseFloat(response.data[0].value);
        }
        return null;
    };

    const handleGetRecommendations = async () => {
        setError('');
        setResults(null);

        let parsedLat = parseFloat(lat);
        let parsedLon = parseFloat(lon);

        if (gpsAutoEnabled) {
            const gps = await refreshGpsLocation();
            if (gps.success) {
                parsedLat = gps.lat;
                parsedLon = gps.lon;
            }
        }

        if (!crop) {
            setError('Please select a crop.');
            return;
        }
        if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
            setError(
                gpsAutoEnabled
                    ? 'Could not read GPS location. Allow location access or turn off Use GPS to enter coordinates manually.'
                    : 'Enter valid latitude and longitude, or click on the map.'
            );
            return;
        }
        if (!isWithinEthiopia(parsedLat, parsedLon)) {
            setError('Location must be within Ethiopia (lat 3.4–14.9, lon 33.0–48.0).');
            return;
        }
        if (advisoryLayers.length === 0) {
            setError(`No dominant advisory layers found for ${formatCropName(crop)}.`);
            return;
        }

        setLoading(true);
        const date = forecastDateFromYear(year);

        try {
            const rows = await Promise.all(
                advisoryLayers.map(async (item) => {
                    try {
                        const value = await fetchCoordinateValue(
                            item.layer,
                            parsedLat,
                            parsedLon,
                            date
                        );
                        return {
                            ...item,
                            value,
                            displayValue:
                                value != null ? Math.round(value).toLocaleString() : null,
                        };
                    } catch (err) {
                        console.error(`Error fetching ${item.layer}:`, err);
                        return { ...item, value: null, displayValue: null };
                    }
                })
            );

            setResults({
                crop,
                year,
                date,
                lat: parsedLat,
                lon: parsedLon,
                rows,
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load recommendations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCsv = () => {
        if (!results) return;

        const headers = ['Crop', 'Year', 'Forecast', 'latitude', 'longitude', 'Product', 'Rate', 'Unit'];
        const lines = [
            headers.join(','),
            ...results.rows.map((row) =>
                [
                    `"${formatCropName(results.crop)}"`,
                    results.year,
                    `"${results.date}"`,
                    results.lat,
                    results.lon,
                    `"${row.label}"`,
                    row.displayValue ?? 'No data',
                    `"${row.unit}"`,
                ].join(',')
            ),
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `fertilizer_advisory_${results.crop}_${results.year}_${results.lat}_${results.lon}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleClear = () => {
        setResults(null);
        setError('');
        if (markerRef.current && mapRef.current) {
            mapRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
        if (gpsAutoEnabled) {
            refreshGpsLocation();
        } else {
            setLat('');
            setLon('');
        }
    };

    return (
        <div className="fert-lookup dash-page">
            <header className="fert-lookup__hero">
                <h1>Site fertilizer advisory</h1>
                <p>
                    Choose year and crop, use GPS at your field (or pick on the map / type
                    coordinates), and view all site-specific dominant-scenario rates (DAP, Urea, NPS,
                    compost, vermi-compost, and expected yield).
                </p>
            </header>

            <div className="fert-lookup__layout">
                <section className="fert-lookup__panel" aria-labelledby="fert-lookup-form-title">
                    <h2 id="fert-lookup-form-title">Your field</h2>

                    <div className="fert-lookup__field">
                        <label htmlFor="fert-year">Year</label>
                        <select
                            id="fert-year"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            disabled={loadingLayers}
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                    {y === yearOptions[0] ? ' (current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="fert-lookup__field">
                        <label htmlFor="fert-crop">Crop</label>
                        <select
                            id="fert-crop"
                            value={crop}
                            onChange={(e) => {
                                setCrop(e.target.value);
                                setResults(null);
                            }}
                            disabled={loadingLayers || cropOptions.length === 0}
                        >
                            {cropOptions.length === 0 ? (
                                <option value="">Loading crops…</option>
                            ) : (
                                cropOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {formatCropName(c)}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="fert-lookup__field fert-lookup__field--location">
                        <div className="fert-lookup__location-head">
                            <span className="fert-lookup__location-label">Location (Ethiopia)</span>
                            <div className="fert-lookup__gps-toggle-wrap">
                                {isLocatingGps && (
                                    <span className="fert-lookup__gps-detecting" role="status">
                                        Detecting…
                                    </span>
                                )}
                                <span className="fert-lookup__gps-toggle-text">Use GPS</span>
                                <label
                                    className="fert-lookup__gps-toggle-control"
                                    title={
                                        gpsAutoEnabled
                                            ? 'Live GPS on — coordinates update automatically'
                                            : 'Manual location — map or type coordinates'
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        role="switch"
                                        checked={gpsAutoEnabled}
                                        onChange={(e) => handleGpsToggle(e.target.checked)}
                                        disabled={loading}
                                        aria-label={
                                            gpsAutoEnabled
                                                ? 'Use GPS on, automatic location'
                                                : 'Use GPS off, manual location'
                                        }
                                    />
                                    <span className="fert-lookup__gps-switch" aria-hidden="true" />
                                    <span
                                        className={`fert-lookup__gps-state${
                                            gpsAutoEnabled ? ' fert-lookup__gps-state--on' : ' fert-lookup__gps-state--off'
                                        }`}
                                    >
                                        {gpsAutoEnabled ? 'On' : 'Off'}
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="fert-lookup__coords">
                            <div>
                                <label htmlFor="fert-lat" className="visually-hidden">
                                    Latitude
                                </label>
                                <input
                                    id="fert-lat"
                                    type="number"
                                    step="any"
                                    inputMode="decimal"
                                    placeholder="Latitude"
                                    value={lat}
                                    onChange={(e) => handleCoordInput('lat', e.target.value)}
                                    disabled={gpsAutoEnabled || isLocatingGps}
                                    readOnly={gpsAutoEnabled}
                                />
                            </div>
                            <div>
                                <label htmlFor="fert-lon" className="visually-hidden">
                                    Longitude
                                </label>
                                <input
                                    id="fert-lon"
                                    type="number"
                                    step="any"
                                    inputMode="decimal"
                                    placeholder="Longitude"
                                    value={lon}
                                    onChange={(e) => handleCoordInput('lon', e.target.value)}
                                    disabled={gpsAutoEnabled || isLocatingGps}
                                    readOnly={gpsAutoEnabled}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="fert-lookup__actions">
                        <button
                            type="button"
                            className="fert-lookup__btn fert-lookup__btn--primary"
                            onClick={handleGetRecommendations}
                            disabled={loading || loadingLayers}
                        >
                            <i className="bi bi-search" aria-hidden="true" />
                            Get recommendations
                        </button>
                        <button
                            type="button"
                            className="fert-lookup__btn fert-lookup__btn--secondary"
                            onClick={handleClear}
                            disabled={loading}
                        >
                            Clear
                        </button>
                    </div>

                    {error && (
                        <div className="fert-lookup__error" role="alert">
                            {error}
                        </div>
                    )}

                    {!loadingLayers && advisoryLayers.length > 0 && (
                        <p className="fert-lookup__meta fert-lookup__meta--panel">
                            {advisoryLayers.length} products for {formatCropName(crop)} · forecast{' '}
                            {forecastDateFromYear(year)} · dominant scenario
                        </p>
                    )}
                </section>

                <section className="fert-lookup__map-wrap">
                    <p className="fert-lookup__map-hint">
                        <i className="bi bi-crosshair" aria-hidden="true" /> Use GPS toggle
                        (on = live location; off = map or type coordinates)
                        {!mapReady && typeof L === 'undefined' && (
                            <span> — map loading; you can still type coordinates.</span>
                        )}
                    </p>
                    <div ref={mapContainerRef} className="fert-lookup__map" />
                </section>
            </div>

            {(loading || results) && (
                <section className="fert-lookup__results" aria-live="polite">
                    {loading && (
                        <div className="fert-lookup__loading">
                            <div className="fert-lookup__spinner" />
                            <span>Fetching site-specific rates for all products…</span>
                        </div>
                    )}

                    {results && !loading && (
                        <>
                            <div className="fert-lookup__results-header">
                                <div>
                                    <h2>
                                        Recommendations for {formatCropName(results.crop)}
                                    </h2>
                                    <p className="fert-lookup__meta">
                                        {results.lat}, {results.lon} · Year {results.year} (
                                        {results.date}) · dominant layers
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="fert-lookup__btn fert-lookup__btn--secondary"
                                    onClick={handleDownloadCsv}
                                >
                                    <i className="bi bi-download" aria-hidden="true" />
                                    Download CSV
                                </button>
                            </div>

                            <div className="fert-lookup__grid">
                                {results.rows.map((row) => (
                                    <article
                                        key={row.productKey}
                                        className={`fert-lookup__card${
                                            row.productKey === 'yield'
                                                ? ' fert-lookup__card--yield'
                                                : ''
                                        }${row.displayValue == null ? ' fert-lookup__card--na' : ''}`}
                                    >
                                        <div className="fert-lookup__card-label">{row.label}</div>
                                        <div className="fert-lookup__card-value">
                                            {row.displayValue ?? 'No data'}
                                        </div>
                                        {row.displayValue != null && (
                                            <div className="fert-lookup__card-unit">
                                                {row.unit}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}

export default FertilizerLookup;
