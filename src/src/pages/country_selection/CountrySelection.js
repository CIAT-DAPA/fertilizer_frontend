import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Annotation } from 'react-simple-maps';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Configuration from '../../conf/Configuration';
import LocationStatusBanner from '../../components/location/LocationStatusBanner';
import './CountrySelection.css';

const GEO_URL = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: 10,
    borderColor: state.isFocused ? '#52b788' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(82, 183, 136, 0.25)' : 'none',
    minHeight: 44,
    '&:hover': { borderColor: '#52b788' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#2d6a4f' : state.isFocused ? '#ecfdf5' : '#fff',
    color: state.isSelected ? '#fff' : '#0f172a',
  }),
};

function CountrySelection() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [countries, setCountries] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const navigatingRef = useRef(false);
  const navigate = useNavigate();
  const report = useSelector((state) => state.report);

  useEffect(() => {
    let cancelled = false;
    setCountriesLoading(true);
    axios
      .get(Configuration.get_url_api_base() + 'country')
      .then((response) => {
        if (cancelled) return;
        const mapped = response.data.map((obj) => ({
          coords: obj.coordinates.split(',').map((s) => parseFloat(s)),
          id: obj.id,
          value: obj.iso2,
          label: obj.name,
        }));
        setCountries(mapped);
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!countries?.length || !report.country) return;
    const match = countries.find(
      (c) =>
        String(c.id) === String(report.country[1]) ||
        c.label === report.country[0],
    );
    if (match) {
      setSelectedCountry(match);
      setHoveredCountry(match);
    }
  }, [countries, report.country]);

  useEffect(() => {
    fetch(GEO_URL)
      .then((response) => response.json())
      .then((data) => setCountryData(data));
  }, []);

  const findCountryByGeoName = useCallback(
    (geoName) => countries?.find((c) => c.label === geoName) ?? null,
    [countries],
  );

  const isCountryAvailable = useCallback(
    (geoName) => Boolean(findCountryByGeoName(geoName)),
    [findCountryByGeoName],
  );

  const handleCountrySelect = useCallback(
    (selectedOption) => {
      if (!selectedOption || navigatingRef.current) return;
      navigatingRef.current = true;
      setSelectedCountry(selectedOption);
      setHoveredCountry(selectedOption);
      navigate(
        '/country_selected/' + encodeURIComponent(selectedOption.label) + '/' + selectedOption.id,
      );
    },
    [navigate],
  );

  const handleMapCountryClick = (geo) => {
    if (countriesLoading || !countries?.length) return;
    const option = findCountryByGeoName(geo.properties.name);
    if (option) handleCountrySelect(option);
  };

  const handleMouseEnter = (geo) => {
    const name = geo.properties.name;
    if (!isCountryAvailable(name)) {
      setHoveredCountry(null);
      return;
    }
    const match = findCountryByGeoName(name);
    setHoveredCountry(match);
  };

  const handleMouseLeave = () => {
    setHoveredCountry(selectedCountry);
  };

  const getGeographyStyle = (geo) => {
    const name = geo.properties.name;
    const available = isCountryAvailable(name);
    const isHovered = hoveredCountry?.label === name;
    const isSelected = selectedCountry?.label === name;

    if (!available) {
      return {
        default: { fill: '#eef2f6', outline: 'none', stroke: '#fff', strokeWidth: 0.25 },
        hover: { fill: '#eef2f6', outline: 'none', cursor: 'default' },
        pressed: { fill: '#eef2f6', outline: 'none' },
      };
    }

    let fill = '#40916c';
    if (isSelected) fill = '#1b4332';
    else if (isHovered) fill = '#2d6a4f';

    return {
      default: {
        fill,
        outline: 'none',
        stroke: '#fff',
        strokeWidth: 0.5,
        transition: 'fill 0.2s ease',
      },
      hover: {
        fill: '#2d6a4f',
        outline: 'none',
        cursor: 'pointer',
        stroke: '#fff',
        strokeWidth: 0.6,
      },
      pressed: {
        fill: '#1b4332',
        outline: 'none',
        cursor: 'pointer',
      },
    };
  };

  const showAnnotation =
    hoveredCountry &&
    countries?.some((c) => c.label === hoveredCountry.label);

  return (
    <div className="home-landing">
      <header className="home-landing__hero">
        <h1 className="home-landing__title text-center font-link">
          HaFAS Advisory Platform
        </h1>
        <p className="home-landing__lead font-link-body">
          Harmonized Digital Fertilizer and Agronomic Solutions (HaFAS) is a nationally coordinated
          digital agriculture platform designed to deliver context-specific, climate-smart, and
          data-driven agronomic advisory services for Ethiopia&apos;s diverse farming systems. By
          integrating advanced analytics, artificial intelligence (AI), geospatial data, soil
          intelligence, and local agronomic expertise, HaFAS transforms fertilizer recommendations
          into actionable insights that support improved productivity, soil health, and sustainable
          agricultural development. The platform is progressively integrating climate information,
          lime application guidance, and crop-specific agronomic recommendations to empower millions
          of farmers with scalable, farmer-centered digital advisory services across Ethiopia.
        </p>
      </header>

      <LocationStatusBanner variant="landing" />

      <section className="home-landing__panel" aria-labelledby="home-select-country">
        <div className="home-landing__panel-head">
          <div>
            <h2 id="home-select-country" className="home-landing__panel-title">
              Select a country
            </h2>
            <p className="home-landing__panel-sub">
              Choose from the list or click an available country on the map
            </p>
          </div>
          <div className="home-landing__select-wrap">
            <Select
              options={countries}
              value={selectedCountry}
              onChange={handleCountrySelect}
              placeholder={countriesLoading ? 'Loading countries…' : 'Select…'}
              isLoading={countriesLoading}
              isDisabled={countriesLoading || navigatingRef.current}
              isClearable={false}
              styles={selectStyles}
              aria-label="Select a country"
            />
          </div>
        </div>

        <p className="home-landing__map-hint">
          <i className="bi bi-hand-index-thumb" aria-hidden="true" />
          Click a highlighted country on the map to continue to region, zone, woreda &amp; kebele
        </p>

        <div className="home-landing__map-wrap">
          {countryData && (
            <ComposableMap
              width={1280}
              height={520}
              projectionConfig={{ scale: 165, center: [20, 5] }}
            >
              <Geographies geography={countryData}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={getGeographyStyle(geo)}
                      onMouseEnter={() => handleMouseEnter(geo)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleMapCountryClick(geo)}
                    />
                  ))
                }
              </Geographies>
              {showAnnotation && (
                <Annotation
                  subject={hoveredCountry.coords}
                  dx={0}
                  dy={0}
                  connectorProps={{
                    stroke: '#2d6a4f',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                  }}
                >
                  <rect
                    x={-36}
                    y={-48}
                    width={Math.max(hoveredCountry.label.length * 8, 72)}
                    height={32}
                    rx={6}
                    fill="#1b4332"
                    pointerEvents="none"
                  />
                  <text
                    x={0}
                    y={-28}
                    textAnchor="middle"
                    pointerEvents="none"
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 13,
                      fill: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {hoveredCountry.label}
                  </text>
                </Annotation>
              )}
            </ComposableMap>
          )}
        </div>

        {countries?.length > 0 && (
          <div className="home-landing__chips" role="list" aria-label="Available countries">
            {countries.map((c) => (
              <button
                key={c.id}
                type="button"
                role="listitem"
                className={`home-landing__chip${selectedCountry?.id === c.id ? ' home-landing__chip--active' : ''}`}
                onClick={() => handleCountrySelect(c)}
              >
                <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                {c.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="home-landing__steps" aria-label="How it works">
        <div className="home-landing__step">
          <span className="home-landing__step-num">1</span>
          <strong>Select country</strong>
          <span>Pick Ethiopia from the map or dropdown</span>
        </div>
        <div className="home-landing__step">
          <span className="home-landing__step-num">2</span>
          <strong>Choose admin units</strong>
          <span>Region → zone → woreda → kebele</span>
        </div>
        <div className="home-landing__step">
          <span className="home-landing__step-num">3</span>
          <strong>Get advisories</strong>
          <span>Maps, nutrients, climate &amp; PDF reports</span>
        </div>
      </section>
    </div>
  );
}

export default CountrySelection;
