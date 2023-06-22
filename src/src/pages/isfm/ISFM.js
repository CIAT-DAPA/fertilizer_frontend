import React from 'react'

import Sidebar from '../../components/sidebar/Sidebar';
import Map from '../../components/map/Map';
import axios from 'axios';
import Configuration from "../../conf/Configuration";


function ISFM() {

    const [opt_forecast, setOptForecast] = React.useState([]);
    const [opt_crops, setOptCrops] = React.useState([]);
    const [opt_scenarios, setOptScenarios] = React.useState([{ label: "Normal", value: "normal" }, { label: "Above", value: "above" }, { label: "Below", value: "below" }]);
    const [map_init, setMap_init] = React.useState({ center: [9.3988271, 39.9405962], zoom: 6 });
    const [filters, setFilters] = React.useState({scenario: opt_scenarios[0].value});
    const [crops, setCrops] = React.useState([])
 
    
   
    const changeForecast = event => {
        const changedFiltersValues = {
            ...filters,
            forecast: event.value
            
        }
        setFilters(changedFiltersValues);
    };

    const changeCrop = event => {
        const changedFiltersValues = {
            ...filters,
            crop: event.value
            
        }
        setFilters(changedFiltersValues);
    };

    const changeScenario = event => {
        const changedFiltersValues = {
            ...filters,
            scenario: event.value
            
        }
        setFilters(changedFiltersValues);
        //console.log(filters);
        
    };

     // change scenario dominant
     React.useEffect(() => {
        if ( filters.forecast && filters.forecast !== "2022-07" ) {
            if ( !opt_scenarios.includes({ label: "Dominant", value: "dominant" }) ) {
                setOptScenarios( [...opt_scenarios, { label: "Dominant", value: "dominant" } ] )
            }
        } else {
          setOptScenarios( opt_scenarios.filter(filter => filter.value !== "dominant"))
        }
    }, [filters.forecast])

    // load of date forecast by crop
    React.useEffect(() => {
        if ( filters.crop && crops.length > 0 ) {
            const cropFound = crops.find(prop => prop.name === filters.crop)
            axios.get(Configuration.get_url_api_base() + `forecast/${cropFound.id}`)
            .then(response => {
                const date = response.data.map(forecast => ({ label: forecast.date, value: forecast.date }))
                setFilters({ ...filters, forecast: date.at(-1).value })
                setOptForecast(date);
            }); 
        }
          
    }, [filters.crop])
  
    // Load of crops
    React.useEffect(() => {
        if ( opt_forecast.length === 0) {
            axios.get(Configuration.get_url_api_base() + "crops")
            .then(response => {
                const crops = response.data.map(crop => ({ label: crop.name.charAt(0).toUpperCase() + crop.name.slice(1), value: crop.name }))
                setFilters({ ...filters, crop: crops[0].value })
                setOptCrops(crops);
                setCrops(response.data)
            });
        } 
    }, [])

   
    return (
        
        <div>

        <div className='mt-3'>

            <h2 className="font-link text-center">ISFM advisories</h2>

            <p className="font-link-body">
            Inorganic fertilizer could be expensive and may not be affordable by smallholders or
                        it may not be accessible due to different logistical reasons. In addition, inorganic
                        fertilizer can be more productive and sustainable when integrated with other good agronomic practices.
                        Thus, this component of the NextGen tool provides location- and context- specific organic and soil
                        fertility management advisories.

            </p>
            
            <p className="font-link-body">
            Compost and vermi-compost (t/ha)
            </p>
        </div>

        <div style={{'position': 'relative'}}>
            {opt_forecast.length > 0 && filters.forecast && opt_crops.length > 0 && filters.crop &&
                <>
                    <Sidebar opt_forecast={opt_forecast} opt_crops={opt_crops} opt_scenarios={opt_scenarios} OnChangeForecast={changeForecast} OnChangeCrop={changeCrop} OnChangeScenario={changeScenario}/>
                    <Map id="map_organic_fertilizers" init={map_init} type={"compost"} crop={filters.crop} forecast={filters.forecast} scenario={filters.scenario} style={{height: '80vh'}} cuttable={true} downloadable={true} legend={true}/>
                </>
            }
        </div>
    
        </div>
    );
}

export default ISFM;