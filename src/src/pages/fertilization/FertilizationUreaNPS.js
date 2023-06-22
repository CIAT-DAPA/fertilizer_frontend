import React from 'react'
import Sidebar from '../../components/sidebar/Sidebar';
import Map from '../../components/map/Map';
import axios from 'axios';
import Configuration from "../../conf/Configuration";

function FertilizationUreaNPS() {
    const [opt_forecast, setOptForecast] = React.useState([]);
    const [opt_crops, setOptCrops] = React.useState([]);
    const [opt_scenarios, setOptScenarios] = React.useState([{ label: "Normal", value: "normal" }, { label: "Above", value: "above" }, { label: "Below", value: "below" }, { label: "Dominant", value: "dominant" }]);
    const [map_init, setMap_init] = React.useState({ center: [9.3988271, 39.9405962], zoom: 6 });
    const [forecast, setForecast] = React.useState();
    const [crop, setCrop] = React.useState();
    const [scenario, setScenario] = React.useState(opt_scenarios[0].value);
    const [crops, setCrops] = React.useState([])
    
    const [tableData, setTableData] = React.useState();
   
    const changeForecast = event => {
        setForecast(event.value);
    };

    const changeCrop = event => {
        setCrop(event.value);
    };

    const changeScenario = event => {
        setScenario(event.value);
    };

     // change scenario dominant
     React.useEffect(() => {
        if ( forecast && forecast !== "2022-07" ) {
            if ( !opt_scenarios.includes({ label: "Dominant", value: "dominant" }) ) {
                setOptScenarios( [...opt_scenarios, { label: "Dominant", value: "dominant" } ] )
            }
        } else {
          setOptScenarios( opt_scenarios.filter(filter => filter.value !== "dominant"))
        }
    }, [forecast])

    // load of date forecast by crop
    React.useEffect(() => {
        if ( crop && crops.length > 0 ) {
            const cropFound = crops.find(prop => prop.name === crop)
            axios.get(Configuration.get_url_api_base() + `forecast/${cropFound.id}`)
            .then(response => {
                const date = response.data.map(forecast => ({ label: forecast.date, value: forecast.date }))
                setForecast(date.at(-1).value)
                setOptForecast(date);
            }); 
        }
          
    }, [crop])
  
    // Load of crops
    React.useEffect(() => {
        if ( opt_forecast.length === 0) {
            axios.get(Configuration.get_url_api_base() + "crops")
            .then(response => {
                const crops = response.data.map(crop => ({ label: crop.name.charAt(0).toUpperCase() + crop.name.slice(1), value: crop.name }))
                setCrop(crops[0].value)
                setOptCrops(crops);
                setCrops(response.data)
            });
        } 
    }, [])

    return (
        <div>

            <div className='mt-3'>

                <h2 className="font-link text-center">Fertilizer advisories NPS Urea</h2>

                <p className="font-link-body">
                    The fertilizer recommendation component of NextGenAgroadvisory is location-, context-, and season- 
                        intelligent system of advising fertilizer type, amount, and time of application in wheat growing 
                        environments of Ethiopia. It is a data-driven approach based on systematic integration of large legacy 
                        agronomic data collated throughout Ethiopia and corresponding co-variates (environmental variables) 
                        using machine learning algorithms.

                </p>
                    
                <p className="font-link-body">
                The amount of NPS and Urea that should be recommended to get optimal yield.
                </p>
            </div>

            <div style={{'position': 'relative'}}>

                {opt_forecast.length > 0 && forecast && opt_crops.length > 0 && crop &&
                    <>
                        <Sidebar opt_forecast={opt_forecast} opt_crops={opt_crops} opt_scenarios={opt_scenarios} OnChangeForecast={changeForecast} OnChangeCrop={changeCrop} OnChangeScenario={changeScenario}/>
                        <Map id="map_nps_urea" init={map_init} type={"nps_urea"} crop={crop} forecast={forecast} 
                            scenario={scenario} style={{height: '80vh'}} cuttable={true} downloadable={true} legend={true}/>
                     </>
                }
            </div>

        </div>
     
    );
}

export default FertilizationUreaNPS;