import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Annotation } from 'react-simple-maps';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import { setReportInput } from '../../slices/reportSlice';
import axios from "axios";
import Configuration from "../../conf/Configuration";
//redux
import { useDispatch } from 'react-redux';


const CountrySelection = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const navigate = useNavigate();
  const formValues = {
    country: null,
    type: null,
    region: null,
    zone: null,
    woreda: null,
    kebele: null,
    ad_fertilizer: null,
    ad_aclimate: null,
    ad_risk: null,
    ad_optimal: null

  };
  const geoUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

  const [countries, setCountries] = useState(null)

  // [
  //   { value: 'et', label: 'Ethiopia', coords: [38.0000000, 8.0000000] },
  //   //{ value: 'co', label: 'Colombia', coords: [-74.297333, 4.570868]}
  //   // Agrega más países aquí
  // ];

  const dispatch = useDispatch();

  useEffect(() => {
    //setloading({ ...loading, r: "loading" })
    axios.get(Configuration.get_url_api_base() + "country")
      .then(response => {
        // Mapear el array y cambiar los nombres de los atributos
        let arrayModificado = response.data.map(obj => ({
          coords: obj.coordinates.split(',').map(function(cadena) {
            return parseFloat(cadena);
          }),
          id: obj.id,
          value: obj.iso2,
          label: obj.name,
        }));
        setCountries(arrayModificado);

      });
  }, [!countries])

  useEffect(() => {
    fetch(geoUrl)
      .then((response) => response.json())
      .then((data) => setCountryData(data));
  }, [geoUrl]);

  const handleCountrySelect = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setHoveredCountry(selectedOption);
    formValues.country = [selectedOption.label, selectedOption.id];
    dispatch(setReportInput({ formValues }));

    if (selectedOption) {
      navigate("/country_selected/"+selectedOption.label+"/"+selectedOption.id);
    }
  };

  const handleMouseEnter = (geography) => {
    const countryLabel = geography.properties.name;
    if (countries.some((country) => country.label === countryLabel)) {
      setHoveredCountry({ label: countryLabel, coords: countries.find((country) => country.label === countryLabel).coords });
      geography.style = highlightCountry(geography);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
  };

  const highlightCountry = (geography) => {
    return {
      default: {
        fill: countries?.length > 0 && countries.find((country) => country.label === geography.properties.name) ? '#009975' : "#EEE",
        outline: 'none',
      }, hover: {
        fill: hoveredCountry && hoveredCountry.label === geography.properties.name ? '#009975' : "#EEE",
        outline: 'none',
      },
      pressed: {
        fill: "#EEE",
        outline: 'none',
      }
    };
  };

  return (
    <div className='mt-3 container' >
      <h2 className='text-center font-link'>NextGen Agroadvisory</h2>
      <p className="font-link-body">NextGenAgroadvisory is a project designed to develop location-, context-, and climate- specific agricultural advisories particularly related to optimal fertilizer application, integrated soil fertility management (ISFM), climate information service, climate smart agricultural activities (CSA), pest and disease surveillance, and other agricultural investments in Ethiopia. It is a project by the Alliance of Bioversity International and the International Center for Tropical Agriculture (CIAT) in partnership with support of SSHI (BMGF), EiA (oneCGIAR initiative), AICCRA (World Bank), and SI-MFS (oneCGIAR initiative).</p>
      <p className="font-link-body">Select a country</p>
      <div className='col-3'>
        <Select
          options={countries}
          value={selectedCountry}
          onChange={handleCountrySelect}
        />
      </div>

      <ComposableMap width={1300} height={500} >
        <Geographies geography={countryData}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={highlightCountry(geo)}
                onMouseEnter={() => handleMouseEnter(geo)}
                onMouseLeave={() => handleMouseLeave()}
              />
            ))
          }
        </Geographies>
        {hoveredCountry && countries.some((country) => country.label === hoveredCountry.label) && (

          <Annotation
            subject={hoveredCountry.coords}
            dx={0}
            dy={0}
            connectorProps={{
              stroke: '#009975',
              strokeWidth: 2,
              strokeLinecap: 'round',
            }}
          >
            <rect
              x={-30} // Ajusta según sea necesario
              y={-45} // Ajusta según sea necesario
              width={hoveredCountry.label.length * 8} // Ajusta según sea necesario
              height={30} // Ajusta según sea necesario
              rx={5} // Ajusta según sea necesario para bordes redondeados
              fill="#5D5A6D" // Color del fondo del letrero
              pointerEvents='none'
            />
            <polygon
              points="-15,-20 0,-10 15,-20" // Ajusta según sea necesario
              fill="#5D5A6D" // Color del fondo del letrero
              pointerEvents='none'

            />
            <text
              x={4}
              y={-25} // Ajusta según sea necesario para centrar verticalmente
              textAnchor="middle"
              style={{
                fontFamily: 'system-ui',
                fontSize: 12,
                fill: '#fff',
                fontWeight: 'bold',
                pointerEvents: 'none',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5))',
              }}
            >
              {hoveredCountry.label}
            </text>


          </Annotation>


        )}
      </ComposableMap>

    </div>
  );
};

export default CountrySelection;
