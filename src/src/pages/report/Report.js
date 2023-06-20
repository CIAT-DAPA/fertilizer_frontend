import React from 'react';
import axios from "axios";
import html2canvas from "html2canvas";
import JsPDF from "jspdf";
import { Carousel, CarouselItem } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import './Report.css'
import Map from '../../components/map/Map';
import GeoFeatures from '../../services/GeoFeatures';
import DonutChart from '../../components/chart/DonutCharts';
import ColumnChart from '../../components/chart/ColumnChart';
import Configuration from "../../conf/Configuration";
import SelectFilters from '../../components/select_filters/SelectFilters';
import Spinners from '../../components/loading/Spinners';
import LoadingReport from "../../components/loading/LoadingReport";
const bbox = require('geojson-bbox');

function Report() {

    const reportInput = useSelector((state) => state.report);
    //console.log(reportInput);

    const [map_init, setMap_init] = React.useState({ center: [9.3988271, 39.9405962], zoom: 5 });
    const [bounds, setBounds] = React.useState([[10, 30], [8.5, 50],])
    const [opt_forecast, setOptForecast] = React.useState([]);
    const [forecast, setForecast] = React.useState();
    const [opt_crops, setOptCrops] = React.useState([]);
    const [opt_scenarios, setOptScenarios] = React.useState(["normal", "above", "below"]);
    const [crop, setCrop] = React.useState();
    const [scenario, setScenario] = React.useState(opt_scenarios[0].value);
    const [geoJson, setGeoJson] = React.useState();
    const [barChartData, setBarChartData] = React.useState();
    const [risk, setRisk] = React.useState();
    const [seasonal, setSeasonal] = React.useState(null);
    const [forecasts, setForecasts] = React.useState([]);
    const [crops, setCrops] = React.useState([])
    const [load, setLoad] = React.useState(false);

    // changing scenarios and loading data for graphs when date forescat changes
    React.useEffect(() => {
        const fetchData = async () => {
            setLoad(false);
            if (reportInput.kebele && forecasts.length > 0) {
                if (forecast !== "2022-07") {
                    if (!opt_scenarios.includes("dominant")) {
                        setOptScenarios([...opt_scenarios, "dominant"])
                    }
                } else {
                    setOptScenarios(opt_scenarios.filter(filter => filter !== "dominant"))
                }

                const forecastFound = forecasts.find(prop => prop.date === forecast)
                await axios.get(Configuration.get_url_api_base() + "metrics/" + reportInput.kebele[0])
                    .then(response => {
                        setBarChartData(response.data.filter(data => data.forecast === forecastFound.id));
                    });

                await axios.get(Configuration.get_url_api_base() + "risk/" + reportInput.kebele[0])
                    .then(response => {
                        setRisk(response?.data[0]?.risk?.values[0])
                        setLoad(true)
                    });

                if (reportInput.kebele[3]) {
                    await axios.get(Configuration.get_url_aclimate_api_base() + "Forecast/Climate/" + reportInput.kebele[3] + "/false/json")
                        .then(response => {
                            console.log(response)
                            if (response.data?.climate[0]?.data)
                                setSeasonal(response.data?.climate[0])
                        }
                        );
                }
                ;
            }
        }
        fetchData()

    }, [forecast]);

    // load of date forecast by crop
    React.useEffect(() => {
        if (crop && crops.length > 0) {
            const cropFound = crops.find(prop => prop.name === crop)
            axios.get(Configuration.get_url_api_base() + `forecast/${cropFound.id}`)
                .then(response => {
                    const date = response.data.map(forecast => ({ label: forecast.date, value: forecast.date }))
                    setForecasts(response.data);
                    setForecast(date.at(-1).value);
                    setOptForecast(date);
                });
        }

    }, [crop])

    // Initial load, crops and geojson
    React.useEffect(() => {
        if (reportInput.kebele) {
            GeoFeatures.geojsonKebele(reportInput.kebele[2]).then((data_geo) => {
                const extent = bbox(data_geo);
                setBounds([[extent[1], extent[0]], [extent[3], extent[2]]])
                setGeoJson(data_geo)
            });
        }
        if (opt_forecast.length === 0) {
            axios.get(Configuration.get_url_api_base() + "crops")
                .then(response => {
                    const crops = response.data.map(crop => ({ label: crop.name.charAt(0).toUpperCase() + crop.name.slice(1), value: crop.name }))
                    setCrop(crops[0].value)
                    setOptCrops(crops);
                    setCrops(response.data)
                });
        }
    }, [])

    const changeForecast = event => {
        setForecast(event.value);
    };

    const changeCrop = event => {
        setCrop(event.value);
    };

    // Generate the pdf based on a component
    const createPDF = async () => {

        let html = document.querySelector('#report')
        console.log(html.offsetWidth, html.offsetHeight)
        let report = new JsPDF('p', 'px', [html.offsetHeight + 50, html.offsetWidth + 50]);
        const canvas = await html2canvas(html, {
            useCORS: true,
            allowTaint: true,
            onrendered: function (canvas) {
                document.body.appendChild(canvas);

            }
        })
        const img = canvas.toDataURL("image/png");
        report.addImage(img, 'JPEG', 20, 20, html.offsetWidth, html.offsetHeight);
        report.save(`Report_Kebele_${reportInput.kebele[1]}.pdf`);
    };

    // generate report map
    const Location = ({ id }) => {

        let name = "";

        switch (id) {
            case "recommendation_report":
                name = "Optimal yield map"
                break;
            case "nps_urea_report":
                name = "Fertilizer rate map"
                break;
            case "compost_report":
                name = "Fertilizer rate map (ISFM)"
                break;
            default:
                name = "Location"
                break;
        }

        return (
            <div className="card col-12 col-lg-5 my-2" style={{ minWidth: ((!reportInput.ad_aclimate || !seasonal) && id === "location_report") ? "100%" : "49%", maxHeight: "445.33px" }}>
                <div className="card-body">
                    <h5 className="card-title">{name}</h5>
                    {geoJson && (
                        <Map
                            scenarios={opt_scenarios}
                            crop={crop}
                            scenario="normal"
                            id={id}
                            init={map_init}
                            type={id}
                            geo={geoJson}
                            style={{
                                height: "90%",
                                minHeight: id === "location_report" ? "370px" : "312.29px"
                            }}
                            bounds={bounds}
                            forecast={forecast}
                            legend={id !== "location_report"}
                            styleGeojson={id !== "location_report" && { fillOpacity: 0, color: "red" }}
                        />
                    )}
                </div>
            </div>
        );
    };

    //
    const SeasonalChartCarousel = () => {
        return (
            <div
                className="card col-12 col-md-5 my-2"
                style={{ minWidth: "49%" }}
                key="donutCarousel">
                <div className="card-body">
                    <h5 className="card-title">Seasonal</h5>

                    <Carousel variant="dark" pause="hover">

                        {
                            seasonal.data.map((value, i) => (
                                <Carousel.Item key={i}>
                                    <DonutChart data={value} />
                                </Carousel.Item>


                            ))
                        }

                    </Carousel>
                </div>

            </div>

        )
    }

    const BarChartFert = ({ name, data, tooltip }) => {
        return (
            <div
                className="card col-12 col-md-5 my-2"
                key={"bar_chart_" + name}
                style={{ minWidth: "49%" }}>
                <div className="card-body">
                    <h5 className="card-title">{name}
                    </h5>
                    {tooltip}
                    <ColumnChart data={data} type={'fertilizer_rate'} />

                </div>

            </div>

        )
    }

    const BarChartYield = ({ name, data }) => {
        return (
            <div
                className="card col-12 col-md-5 my-2"
                key={"bar_chart_" + name}
                style={{ minWidth: "49%" }}>
                <div className="card-body">
                    <h5 className="card-title">{name}</h5>
                    <ColumnChart data={data} type={'optimal_yield'} />

                </div>

            </div>

        )
    }

    return (
        <main>
            {reportInput.woreda ? (
                <>
                    <br />
                    <section className='container'>
                        <div className="d-flex justify-content-between font-link">
                            <h3>kebele report: <b>{reportInput.kebele[1]}</b></h3>
                            <button onClick={createPDF} disabled={!(barChartData && opt_forecast && forecast)} type="button" className="btn btn-primary">Export</button>
                        </div>
                        {!opt_forecast.length > 0 ? <Spinners /> :
                            <>
                                <SelectFilters onChangeCrop={changeCrop} onChangeForecast={changeForecast} opt_forecast={opt_forecast} opt_crops={opt_crops} />
                                {barChartData && opt_forecast && forecast &&
                                    <div id='report'>
                                        <div className="row my-3 g-8 row-cols-auto justify-content-between">
                                            {!load ? <LoadingReport /> :
                                                <>
                                                    <Location id="location_report" />
                                                    {seasonal && reportInput.ad_aclimate && <SeasonalChartCarousel />}
                                                    {reportInput.ad_fertilizer &&
                                                        <>
                                                            <div className="alert alert-light my-3 border" role="alert">
                                                                <p className="font-link-body text-justify">
                                                                    Integrated Soil Fertility Management (ISFM) in this study address the integrated use of inorganic fertilizers with organic fertilizer such as verm-icompost, compost, manure, and bio-slurry with a set of locally adapted soil fertility technologies and improved agronomic practices promoted to enhance soil fertility, crop productivity and incomes of smallholder farmers. For this purpose, we developed site-specific recommendations integrated use of organic fertilizer with inorganic fertilizer for profitable wheat production in Ethiopia.
                                                                </p>
                                                                <p className="font-link-body text-justify">
                                                                    Urea is the most concentrated solid nitrogen fertilizer which contain 46% nitrogen and no other plant nutrients. It is the most common fertilizer used as a source of nitrogen in Ethiopia. When it is worked into the soil, it is as effective as any other nitrogen fertilizer and is most efficiently utilized on soils with adequate moisture content, so that the gaseous ammonia can go quickly into solution. In the soil, urea changes to ammonium carbonate which may temporarily cause a harmful local high pH and its use need smart management practices such as split application to allow efficient uptake by plant.
                                                                </p>
                                                                <p className="font-link-body text-justify">
                                                                    NPS blend fertilizer is a mix of single fertilizers which are mixed during the production process into an instant fertilizer recipe, packaged in a big bag. The composition of the mix is homogeneous throughout the entire big bag. This prevents the nutrients from coagulating and turning into hard layers, enabling easy application of the product into the crop field. Different types of blended fertilizers are available in Ethiopia. The NPS blend fertilizer used for crop production in Ethiopia contain nitrogen (19%), phosphorus (38%) and sulphur (7%).
                                                                </p>
                                                            </div>
                                                                <BarChartFert name={"Fertilizer rate"} data={[barChartData[1], barChartData[3]]}
                                                                    tooltip={<p>Urea: compound fertilizer and source of nitrogen <br />
                                                                        NPS: blended fertilizer and source of nitrogen, phosphorus, and sulphur</p>
                                                                    } />
                                                                <Location id="nps_urea_report" />
                                                                <BarChartFert name={"Fertilizer rate (ISFM)"} data={[barChartData[0], barChartData[4]]}
                                                                    tooltip={<p>ISFM: integrated soil fertility management<br /><br /></p>} />
                                                                <Location id="compost_report" />
                                                        </>
                                                    }
                                                    {reportInput.ad_optimal &&
                                                        <>
                                                            <BarChartYield name={"Optimal yield"} data={[barChartData[2]]} />
                                                            <Location id="recommendation_report" />
                                                        </>
                                                    }
                                                    {risk && reportInput.ad_risk && <div className={`alert alert-${risk === "High risk" ? "danger" : "warning"} mt-3 text-center w-100`} role="alert">
                                                        {`Risk: ${risk}`}
                                                    </div>}
                                                    {reportInput.ad_fertilizer && <div className="alert alert-light my-2 border w-100" role="alert">
                                                        <h5>Notes: </h5>
                                                        <ol>
                                                            <li>{`This advisory is for agricultural land allotted to wheat in ${forecast.split('-')[0]} main crop season only.`}</li>
                                                            <li>If there is no sufficient inorganic fertilizer supply, use half inorganic with half organic rates.</li>
                                                        </ol>
                                                    </div>}
                                                </>
                                            }
                                        </div>
                                    </div>
                                }
                            </>
                        }
                    </section>
                </>
            ) : (
                <div className="alert alert-danger mt-4 text-center" role="alert">
                    You have not selected a kebele, go back to the beginning to select one.
                </div>
            )}

        </main>
    )

}

export default Report;