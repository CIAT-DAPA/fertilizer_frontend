import React from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import JsPDF from "jspdf";
import { useSelector } from "react-redux";

import "./ReportWoreda.css";
import Map from "../../components/map/Map";
import GeoFeatures from "../../services/GeoFeatures";
import ColumnChart from "../../components/chart/ColumnChart";
import Configuration from "../../conf/Configuration";
import Chart from "react-apexcharts";
import SelectFilters from '../../components/select_filters/SelectFilters';
import Spinners from '../../components/loading/Spinners';
import LoadingReport from "../../components/loading/LoadingReport";
const bbox = require("geojson-bbox");

function ReportWoreda() {
    const reportInput = useSelector((state) => state.report);

    const [map_init, setMap_init] = React.useState({
        center: [9.3988271, 39.9405962],
        zoom: 5,
    });
    const [bounds, setBounds] = React.useState([
        [10, 30],
        [8.5, 50],
    ]);
    const [geoJson, setGeoJson] = React.useState();
    const [barChartData, setBarChartData] = React.useState();
    const [load, setLoad] = React.useState(false);
    const [kebeles, setKebeles] = React.useState();
    const [chart, setChart] = React.useState();
    const [opt_forecast, setOptForecast] = React.useState([]);
    const [forecast, setForecast] = React.useState();
    const [opt_crops, setOptCrops] = React.useState([]);
    const [opt_scenarios, setOptScenarios] = React.useState(["normal", "above", "below"]);
    const [crop, setCrop] = React.useState();
    const [forecasts, setForecasts] = React.useState([]);
    const [crops, setCrops] = React.useState([])

    React.useEffect(() => {
        setLoad(false);
        if (reportInput.woreda) {

            if (forecast !== "2022-07") {
                if (!opt_scenarios.includes("dominant")) {
                    setOptScenarios([...opt_scenarios, "dominant"])
                }
            } else {
                setOptScenarios(opt_scenarios.filter(filter => filter !== "dominant"))
            }

            const forecastFound = forecasts.find(prop => prop.date === forecast)
            let kebeles;
            let ids = "";
            let sum = []
            const risks = {};
            axios
                .get(Configuration.get_url_api_base() + "adm4/" + reportInput.woreda[0])
                .then(async (response) => {
                    kebeles = response.data;
                    setKebeles(response.data);
                    if (kebeles.length > 0) {
                        kebeles.map((dato, i) => {
                            if (i == kebeles.length - 1)
                                ids += dato.id;
                            else
                                ids += `${dato.id},`;
                        });
                        await axios
                            .get(Configuration.get_url_api_base() + "metrics/" + ids)
                            .then((response) => {
                                const dataFind = response.data.filter(data => data.forecast === forecastFound.id)
                                dataFind.map((kebele) => {
                                    let aux = sum.find(entry => entry.type === kebele.type);

                                    if (!aux) {
                                        // Si el tipo no existe en suma, inicializarlo
                                        aux = {
                                        type: kebele.type,
                                        values: [
                                            { s: 1, values: [0] },
                                            [{ s: 2, values: [0] }],
                                            [{ s: 3, values: [0] }],
                                            kebele.values[3] ? [{ s: 4, values: [0] }] : undefined, 
                                        ].filter(Boolean) // Filtrar para eliminar entradas undefined
                                        };
                                        sum.push(aux);
                                    }

                                    // Sumar los valores correspondientes
                                    aux.values[0].values[0] += kebele.values[0].values[0] / kebeles.length;
                                    aux.values[1][0].values[0] += kebele.values[1][0].values[0] / kebeles.length;
                                    aux.values[2][0].values[0] += kebele.values[2][0].values[0] / kebeles.length;

                                    if (kebele.values[3]) {
                                        aux.values[3] = aux.values[3] || [{ s: 4, values: [0] }];
                                        aux.values[3][0].values[0] += kebele.values[3][0].values[0] / kebeles.length;
                                    }
                                });
                            });
                        await axios
                            .get(Configuration.get_url_api_base() + "risk/" + ids + '/' + forecastFound.id)
                            .then((response) => {
                                //console.log("risk", response.data)
                                if (response.data.length > 0) {
                                    response.data.map((dato) => {
                                        if (risks[dato.risk.values[0]])
                                            risks[dato.risk.values[0]] += 1;
                                        else
                                            risks[dato.risk.values[0]] = 1;
                                    })
                                    const chart = {
                                        series: [{
                                            name: 'Kebeles count',
                                            data: Object.values(risks)
                                        }],
                                        options: {
                                            chart: {
                                                height: 350,
                                                type: 'bar'
                                            },
                                            colors: Object.keys(risks).map(name => {
                                                return name == "High risk" ? "#dc3545" : "#fd7e14"
                                            }),
                                            plotOptions: {
                                                bar: {
                                                    columnWidth: '40%',
                                                    distributed: true,
                                                }
                                            },
                                            dataLabels: {
                                                enabled: false
                                            },
                                            legend: {
                                                show: false
                                            },
                                            xaxis: {
                                                categories: Object.keys(risks),
                                                labels: {
                                                    style: {
                                                        colors: null,
                                                        fontSize: '12px'
                                                    }
                                                }
                                            },
                                            yaxis: {
                                                title: {
                                                    text: 'Kebeles'
                                                }
                                            },
                                        },
                                    };
                                    setChart(chart)
                                }
                                setLoad(true);
                            });
                    } else setLoad(true);
                });
            setBarChartData(sum);
        }
    }, [forecast, opt_forecast]);

    // Initial load, crops and geojson
    React.useEffect(() => {
        if (reportInput.woreda) {
            GeoFeatures.geojsonWoreda("'" + reportInput.woreda[2] + "'").then(
                (data_geo) => {
                    const extent = bbox(data_geo);
                    setBounds([
                        [extent[1], extent[0]],
                        [extent[3], extent[2]],
                    ]);
                    setGeoJson(data_geo);
                }
            );
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

    const changeForecast = event => {
        setForecast(event.value);
    };

    const changeCrop = event => {
        setCrop(event.value);
    };


    // Generate the pdf based on a component
    const createPDF = async () => {
        let html = document.querySelector('#report')
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
        report.save(`Report_Woreda_${reportInput.woreda[1]}.pdf`);
    };

    const Location = ({ id }) => {

        let name = "";

        switch (id) {
            case "recommendation_report_woreda":
                name = "Optimal yield map"
                break;
            case "nps_urea_report_woreda":
                name = "Fertilizer rate map"
                break;
            case "compost_report_woreda":
                name = "Fertilizer rate map (ISFM)"
                break;
            default:
                name = "Location"
                break;
        }

        return (
            <div className="card col-12 col-lg-5 my-2" style={{ minWidth: id === "location_report" ? "100%" : "49%" }}>
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

    const BarChart = ({ name, data, tooltip = null }) => {
        return (
            <div
                className="card col-12 col-lg-5 my-2"
                key={"bar_chart_" + name}
                style={{ minWidth: "49%" }}>
                <div className="card-body">
                    <h5 className="card-title">{name}</h5>
                    {tooltip && tooltip}
                    <ColumnChart data={data} type={name} />
                </div>
            </div>
        )
    }

    return (
        <main>
            {reportInput.woreda ? (
                <>
                    <br />
                    <section className="container">
                        <div className="d-flex justify-content-between font-link">
                            <h3>
                                Woreda report: <b>{reportInput.woreda[1]}</b>
                            </h3>
                            <button onClick={createPDF} disabled={!load} type="button" className="btn btn-primary" > Export </button>
                        </div>
                        {!opt_forecast.length > 0 ? <Spinners /> :
                            <>
                                <SelectFilters onChangeCrop={changeCrop} onChangeForecast={changeForecast} opt_forecast={opt_forecast} opt_crops={opt_crops} />
                                {kebeles.length > 0 ?
                                    <div id="report">
                                        <div className="row my-3 g-8 row-cols-auto justify-content-between">
                                            {!load ? <LoadingReport /> :
                                                <>
                                                    <Location id="location_report" />
                                                    {reportInput.ad_optimal &&
                                                        <>
                                                            <BarChart
                                                                name={"Optimal yield"}
                                                                data={barChartData}
                                                            />
                                                            <Location id="recommendation_report_woreda" />
                                                        </>
                                                    }
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
                                                            <BarChart
                                                                name={"Fertilizer rate"}
                                                                data={barChartData}
                                                                tooltip={<p>Urea: compound fertilizer and source of nitrogen <br />
                                                                    NPS: blended fertilizer and source of nitrogen, phosphorus, and sulphur</p>
                                                                }
                                                            />
                                                            <Location id="nps_urea_report_woreda" />
                                                            <BarChart
                                                                name={"Fertilizer rate (ISFM)"}
                                                                data={barChartData}
                                                                tooltip={<p>ISFM: integrated soil fertility management<br /><br /></p>}
                                                            />
                                                            <Location id="compost_report_woreda" />
                                                        </>
                                                    }
                                                    {
                                                        reportInput.ad_risk && chart &&
                                                        <div
                                                            className="card col-12 col-md-5 my-1"
                                                            key="bar_chart_risk"
                                                            style={{ minWidth: "49%" }}
                                                        >
                                                            <div className="card-body">
                                                                <h5 className="card-title">Risk</h5>
                                                                <Chart options={chart.options} series={chart.series} type="bar" height={300} />
                                                            </div>
                                                        </div>
                                                    }
                                                </>

                                            }
                                        </div>
                                        {reportInput.ad_fertilizer && <div className="alert alert-light my-3 border" role="alert">
                                            <h5>Notes: </h5>
                                            <ol>
                                                <li>{`This advisory is for agricultural land allotted to wheat in ${forecast.split('-')[0]} main crop season only.`}</li>
                                                <li>If there is no sufficient inorganic fertilizer supply, use half inorganic with half organic rates.</li>
                                            </ol>
                                        </div>}
                                    </div>
                                    : <div
                                        className="alert alert-warning mt-4 text-center"
                                        role="alert"
                                    >
                                        The selected Woreda has no kebeles regristred
                                    </div>
                                }
                            </>
                        }
                    </section>
                </>
            ) : (
                <div className="alert alert-danger mt-4 text-center" role="alert">
                    You have not selected a Woreda, go back to the beginning to select
                    one.
                </div>
            )}
        </main>
    );
}

export default ReportWoreda;
