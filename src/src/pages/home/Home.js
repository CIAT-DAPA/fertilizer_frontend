import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import center from "@turf/center";
import { Link } from 'react-router-dom'
import { useNavigate, useParams, useLocation } from 'react-router-dom';

import './Home.css';
import Map from '../../components/map/Map';
import Configuration from "../../conf/Configuration";
import GeoFeatures from '../../services/GeoFeatures';

import { setReportInput } from '../../slices/reportSlice';
import { isReportLocationComplete } from '../../utils/reportLocationUtils';
import { resolveCountryIdForApi } from '../../services/countryApiService';

//redux
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
const bbox = require('geojson-bbox');

/** Serialize location tuple for <select value={…}> (matches option value string). */
function tupleToSelectValue(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  return arr.map((x) => (x != null ? String(x) : '')).join(',');
}

function isAdminSelectionComplete(formValues, forWoreda) {
  if (!formValues.region || !formValues.zone || !formValues.woreda) return false;
  if (forWoreda) return true;
  return !!formValues.kebele;
}

function Home() {
    const [map_init, setMap_init] = React.useState({ center: [9.8088271, 38.0405962], zoom: 5.75 });
    const [selectsValues, setSelectsValues] = React.useState(null);
    const [disabledSelect, setDisabledSelect] = React.useState({ z: true, w: true, k: true });
    const [geoJson, setGeoJson] = React.useState();
    const [forWoreda, setForWoreda] = React.useState(false);
    const [bounds, setBounds] = React.useState([[10, 33], [8.5, 48],])
    const [loading, setloading] = useState({ r: "pending", z: "pending", w: "pending", k: "pending" });
    const [param, setParam] = useState();

    const reportInput = useSelector((state) => state.report);
    const navigate = useNavigate();
    const location = useLocation();
    const { country, id } = useParams();
    const firstTimeSetup = location.state?.fromLanding === true;
    const hadCompleteLocationRef = useRef(isReportLocationComplete(reportInput));
    const redirectedToLandingRef = useRef(false);

    const [formValues, setFormValues] = useState({
        country: [country, id],
        type: "kebele",
        region: null,
        zone: null,
        woreda: null,
        kebele: null,
        ad_fertilizer: true,
        ad_aclimate: true,
        ad_risk: true,
        ad_optimal: true

    });

    const dispatch = useDispatch();

    /** Hydrate draft from Redux when route country changes. Committed state updates on "Advisory" only. */
    useEffect(() => {
        if (!country || !id) return;
        const rc = reportInput.country;
        const sameCountry =
            rc &&
            (String(rc[1]) === String(id) || rc[0] === country);

        if (sameCountry) {
            setFormValues((prev) => ({
                ...prev,
                country: rc,
                type: reportInput.type === 'woreda' ? 'woreda' : 'kebele',
                region: reportInput.region,
                zone: reportInput.zone,
                woreda: reportInput.woreda,
                kebele: reportInput.kebele,
                ad_fertilizer: reportInput.ad_fertilizer != null ? reportInput.ad_fertilizer : prev.ad_fertilizer,
                ad_aclimate: reportInput.ad_aclimate != null ? reportInput.ad_aclimate : prev.ad_aclimate,
                ad_risk: reportInput.ad_risk != null ? reportInput.ad_risk : prev.ad_risk,
                ad_optimal: reportInput.ad_optimal != null ? reportInput.ad_optimal : prev.ad_optimal,
            }));
            setForWoreda(reportInput.type === 'woreda');
            const hasR = !!reportInput.region;
            const hasZ = !!reportInput.zone;
            const hasW = !!reportInput.woreda;
            setDisabledSelect({
                z: !hasR,
                w: !hasZ,
                k: !hasW,
            });
        } else if (!rc) {
            setFormValues((prev) => ({
                ...prev,
                country: [country, id],
            }));
        } else {
            setFormValues((prev) => ({
                ...prev,
                country: [country, id],
                type: 'kebele',
                region: null,
                zone: null,
                woreda: null,
                kebele: null,
            }));
            setForWoreda(false);
            setDisabledSelect({ z: true, w: true, k: true });
        }
    }, [country, id, reportInput.country, reportInput.region, reportInput.zone, reportInput.woreda, reportInput.kebele, reportInput.type]);

    /** First-time setup from home: save location and return to landing instead of report. */
    useEffect(() => {
        if (!firstTimeSetup || hadCompleteLocationRef.current || redirectedToLandingRef.current) return;
        if (!isAdminSelectionComplete(formValues, forWoreda)) return;

        redirectedToLandingRef.current = true;
        dispatch(
            setReportInput({
                formValues: { ...formValues, country: [country, id] },
            }),
        );
        navigate('/', { replace: true });
    }, [
        firstTimeSetup,
        formValues.region,
        formValues.zone,
        formValues.woreda,
        formValues.kebele,
        formValues.type,
        forWoreda,
        country,
        id,
        dispatch,
        navigate,
    ]);

    // Initial load of regions for this country
    useEffect(() => {
        if (!id) return;
        const countryId = resolveCountryIdForApi(id);
        let cancelled = false;
        setloading((prev) => ({ ...prev, r: 'loading' }));
        axios
            .get(Configuration.get_url_api_base() + 'adm1/' + countryId)
            .then((response) => {
                if (cancelled) return;
                setSelectsValues((prev) => ({ ...(prev || {}), regions: response.data }));
                setloading((prev) => ({ ...prev, r: 'pending' }));
            })
            .catch(() => {
                if (!cancelled) setloading((prev) => ({ ...prev, r: 'pending' }));
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Load zones when region changes
    useEffect(() => {
        const regionId = formValues.region?.[0];
        if (!regionId) return;
        let cancelled = false;
        setDisabledSelect({ z: true, w: true, k: true });
        setloading((prev) => ({ ...prev, z: 'loading' }));
        axios
            .get(Configuration.get_url_api_base() + 'adm2/' + regionId)
            .then((response) => {
                if (cancelled) return;
                setSelectsValues((prev) => ({ ...(prev || {}), zones: response.data }));
                setloading({ r: 'uploaded', z: 'pending', w: 'pending', k: 'pending' });
                setDisabledSelect({ z: false, w: true, k: true });
            });
        return () => {
            cancelled = true;
        };
    }, [formValues.region?.[0]]);

    // Load woredas when zone changes
    useEffect(() => {
        const zoneId = formValues.zone?.[0];
        if (!zoneId) return;
        let cancelled = false;
        setDisabledSelect((d) => ({ ...d, w: true, k: true }));
        setloading((prev) => ({ ...prev, w: 'loading' }));
        axios
            .get(Configuration.get_url_api_base() + 'adm3/' + zoneId)
            .then((response) => {
                if (cancelled) return;
                setSelectsValues((prev) => ({ ...(prev || {}), woredas: response.data }));
                setloading((prev) => ({ ...prev, z: 'uploaded', w: 'pending', k: 'pending' }));
                setDisabledSelect((d) => ({ ...d, w: false, k: true }));
            });
        return () => {
            cancelled = true;
        };
    }, [formValues.zone?.[0]]);

    // Load kebeles when woreda changes
    useEffect(() => {
        const woredaId = formValues.woreda?.[0];
        if (!woredaId) return;
        let cancelled = false;
        setDisabledSelect((d) => ({ ...d, k: true }));
        setloading((prev) => ({ ...prev, k: 'loading' }));
        axios
            .get(Configuration.get_url_api_base() + 'adm4/' + woredaId)
            .then((response) => {
                if (cancelled) return;
                setSelectsValues((prev) => ({ ...(prev || {}), kebeles: response.data }));
                setloading((prev) => ({ ...prev, k: 'pending', w: 'uploaded' }));
                setDisabledSelect((d) => ({ ...d, k: false }));
            });
        return () => {
            cancelled = true;
        };
    }, [formValues.woreda?.[0]]);

    // status icons
    const icon = (statu) => {
        switch (statu) {
            case "pending":
                return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z" />
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z" />
                </svg>)

            case "loading":
                return <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>

            case "uploaded":
                return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16">
                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                </svg>)
            default:
                return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bug" viewBox="0 0 16 16">
                    <path d="M4.355.522a.5.5 0 0 1 .623.333l.291.956A4.979 4.979 0 0 1 8 1c1.007 0 1.946.298 2.731.811l.29-.956a.5.5 0 1 1 .957.29l-.41 1.352A4.985 4.985 0 0 1 13 6h.5a.5.5 0 0 0 .5-.5V5a.5.5 0 0 1 1 0v.5A1.5 1.5 0 0 1 13.5 7H13v1h1.5a.5.5 0 0 1 0 1H13v1h.5a1.5 1.5 0 0 1 1.5 1.5v.5a.5.5 0 1 1-1 0v-.5a.5.5 0 0 0-.5-.5H13a5 5 0 0 1-10 0h-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 1 1-1 0v-.5A1.5 1.5 0 0 1 2.5 10H3V9H1.5a.5.5 0 0 1 0-1H3V7h-.5A1.5 1.5 0 0 1 1 5.5V5a.5.5 0 0 1 1 0v.5a.5.5 0 0 0 .5.5H3c0-1.364.547-2.601 1.432-3.503l-.41-1.352a.5.5 0 0 1 .333-.623zM4 7v4a4 4 0 0 0 3.5 3.97V7H4zm4.5 0v7.97A4 4 0 0 0 12 11V7H8.5zM12 6a3.989 3.989 0 0 0-1.334-2.982A3.983 3.983 0 0 0 8 2a3.983 3.983 0 0 0-2.667 1.018A3.989 3.989 0 0 0 4 6h8z" />
                </svg>)
        }
    }



    const onFormSubmit = (e) => {
        e.preventDefault();
        //dispatch(setReportInput({formValues}));

    }

    const onChangeRegion = (e) => {
        GeoFeatures.geojsonRegion(e[2]).then((data_geo) => {
            setGeoJson(data_geo);
            onChangeBounds(data_geo);
        });
        setParam(e[2]);
    }
    const onChangeZone = (e) => {
        GeoFeatures.geojsonZone(e[2]).then((data_geo) => {
            setGeoJson(data_geo);
            onChangeBounds(data_geo);
        });
        setParam(e[2]);
    }
    const onChangeWoreda = (e) => {
        GeoFeatures.geojsonWoreda(e[2]).then((data_geo) => {
            setGeoJson(data_geo);
            onChangeBounds(data_geo);
        });
        setParam(e[2]);
    }
    const onChangeKebele = (e) => {
        GeoFeatures.geojsonKebele(e[2]).then((data_geo) => {
            setGeoJson(data_geo);
            onChangeBounds(data_geo);
        });
        setParam(e[2]);
    }

    //change of bounds for autozoom
    const onChangeBounds = data_geo => {
        try {
            if (data_geo.totalFeatures > 0) {
                const extent = bbox(data_geo);
                setBounds([
                    [extent[1], extent[0]],
                    [extent[3], extent[2]],
                ]);
            }

        } catch (error) {
            console.log('error wiht bounds: ', error)
        }

    }

    const Alert = () => {
        return (
            <div className="alert alert-primary mt-4" role="alert">
                You must select a {forWoreda ? 'Woreda' : 'Kebele'}
            </div>
        )
    }

    const setType = e => {
        setForWoreda(e);
        if (e) {
            setFormValues({ ...formValues, type: "woreda", ad_aclimate: false, kebele: null });
        } else {
            setFormValues({ ...formValues, type: "kebele", ad_aclimate: true });
        }
    }

    const verify = () => {
        const layersOk = formValues.ad_aclimate || formValues.ad_fertilizer || formValues.ad_optimal || formValues.ad_risk;
        return !layersOk || !isAdminSelectionComplete(formValues, forWoreda);
    }

    return (
        <main>
            <br />

            <div className='container'>
                <div className='row'>
                    <div className='col'>
                        <div>
                            <span className="icon">
                                &#x1F870;
                            </span>

                            <Link to="/" className='ms-2 back-button font-link-body'>
                                Do you want to go home page?
                            </Link>

                        </div>

                        <h1 className='font-link text-center'><b>HaFAS Advisory Platform - {country}</b></h1>
                        <p className='font-link-body'>
                        Harmonized Digital Fertilizer and Agronomic Solutions (HaFAS) is a nationally coordinated digital agriculture platform designed to deliver context-specific, climate-smart, and data-driven agronomic advisory services for Ethiopia’s diverse farming systems. By integrating advanced analytics, artificial intelligence (AI), geospatial data, soil intelligence, and local agronomic expertise, HaFAS transforms fertilizer recommendations into actionable insights that support improved productivity, soil health, and sustainable agricultural development. The platform is progressively integrating climate information, lime application guidance, and crop-specific agronomic recommendations to empower millions of farmers with scalable, farmer-centered digital advisory services across Ethiopia.
                        </p>



                    </div>

                </div>

                <div>
                    <label className="switch">
                        <input type="checkbox" checked={forWoreda} onChange={e => setType(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                    Report for Woreda
                </div>

                <div className='row row-content my-4 font-link-body'>
                    <form className='col-md-6' onSubmit={onFormSubmit}>
                        <p className='mb-0'>Choose a location</p>
                        <div className='row form-group'>
                            <div className='col-md-6 mt-3'>
                                <b>Region</b>
                                <div className='input-group'>
                                    <select className="form-select" aria-label="Region" value={tupleToSelectValue(formValues.region)} onChange={e => { const v = e.target.value; if (!v) { setFormValues({ ...formValues, region: null, zone: null, woreda: null, kebele: null }); setDisabledSelect({ z: true, w: true, k: true }); setSelectsValues((prev) => ({ ...prev, zones: null, woredas: null, kebeles: null })); return; } const parts = v.split(","); setFormValues({ ...formValues, region: parts, zone: null, woreda: null, kebele: null }); setDisabledSelect({ z: true, w: true, k: true }); setSelectsValues((prev) => ({ ...prev, zones: null, woredas: null, kebeles: null })); onChangeRegion(parts); }}>
                                        <option key={"region default"} value="">Select a region</option>
                                        {
                                            selectsValues?.regions && selectsValues?.regions.map((currentRegion) => <option key={currentRegion.id} value={[currentRegion.id, currentRegion.name, currentRegion.ext_id]}>{currentRegion.name}</option>)
                                        }
                                    </select>
                                    <span className='input-group-text'>
                                        {icon(loading.r)}
                                    </span>
                                </div>
                            </div>
                            {formValues.region && (
                            <div className='col-md-6 mt-3'>
                                <b>Zone</b>
                                <div className='input-group'>
                                    <select className="form-select" aria-label="Zone" disabled={disabledSelect.z} value={tupleToSelectValue(formValues.zone)} onChange={e => { const v = e.target.value; if (!v) { setFormValues({ ...formValues, zone: null, woreda: null, kebele: null }); setDisabledSelect((d) => ({ ...d, w: true, k: true })); setSelectsValues((prev) => ({ ...prev, woredas: null, kebeles: null })); return; } const parts = v.split(","); setFormValues({ ...formValues, zone: parts, woreda: null, kebele: null }); setDisabledSelect((d) => ({ ...d, w: true, k: true })); setSelectsValues((prev) => ({ ...prev, woredas: null, kebeles: null })); onChangeZone(parts); }}>
                                        <option key={"zone default"} value="">Select a zone</option>
                                        {
                                            selectsValues?.zones && selectsValues?.zones.map((currentZone) => <option key={currentZone.id} value={[currentZone.id, currentZone.name, currentZone.ext_id]}>{currentZone.name}</option>)
                                        }
                                    </select>
                                    <span className='input-group-text'>
                                        {icon(loading.z)}
                                    </span>
                                </div>
                            </div>
                            )}
                            {formValues.zone && (
                            <div className='col-md-6 mt-3'>
                                <b>Woreda</b>
                                <div className='input-group'>
                                    <select className="form-select" aria-label="Woreda" disabled={disabledSelect.w} value={tupleToSelectValue(formValues.woreda)} onChange={e => { const v = e.target.value; if (!v) { setFormValues({ ...formValues, woreda: null, kebele: null }); setDisabledSelect((d) => ({ ...d, k: true })); setSelectsValues((prev) => ({ ...prev, kebeles: null })); return; } const parts = v.split(","); setFormValues({ ...formValues, woreda: parts, kebele: null }); setDisabledSelect((d) => ({ ...d, k: true })); setSelectsValues((prev) => ({ ...prev, kebeles: null })); onChangeWoreda(parts); }}>

                                        <option key={"woreda default"} value="">Select a woreda</option>

                                        {
                                            selectsValues?.woredas && selectsValues?.woredas.map((currentWoreda) => <option key={currentWoreda.id} value={[currentWoreda.id, currentWoreda.name, currentWoreda.ext_id]}>{currentWoreda.name}</option>)
                                        }
                                    </select>
                                    <span className='input-group-text'>
                                        {icon(loading.w)}
                                    </span>
                                </div>

                            </div>
                            )}
                            {formValues.woreda && !forWoreda && (
                            <div className='col-md-6 mt-3'>
                                <b>Kebele</b>
                                <div className='input-group'>
                                    <select className="form-select" aria-label="Kebele" disabled={disabledSelect.k} value={tupleToSelectValue(formValues.kebele)} onChange={e => { const v = e.target.value; if (!v) { setFormValues({ ...formValues, kebele: null }); return; } const parts = v.split(","); setFormValues({ ...formValues, kebele: parts }); onChangeKebele(parts, setloading({ ...loading, k: "uploaded" })); }}>
                                        <option key={"kebele default"} value="">Select a kebele</option>

                                        {
                                            selectsValues?.kebeles && selectsValues?.kebeles.map((currentKebele) => <option key={currentKebele.id} value={[currentKebele.id, currentKebele.name, currentKebele.ext_id, currentKebele.aclimate_id]}>{currentKebele.name}</option>)
                                        }
                                    </select>
                                    <span className='input-group-text'>
                                        {icon(loading.k)}
                                    </span>
                                </div>

                            </div>
                            )}

                            <div className="row mt-4">
                                <div className='col-lg-6 col-md-12 col-sm-6'>
                                    <input className="form-check-input me-2" type="checkbox" checked={formValues.ad_fertilizer} id="ad_fertilizer" onChange={e => setFormValues({ ...formValues, ad_fertilizer: e.target.checked })} />
                                    <label className="form-check-label" htmlFor="ad_fertilizer">
                                        Advisory Fertilizer
                                    </label>

                                </div>
                                <div className='col-lg-6 col-md-12 col-sm-6'>
                                    <input className="form-check-input me-2" type="checkbox" checked={formValues.ad_optimal} id="ad_optimal" onChange={e => setFormValues({ ...formValues, ad_optimal: e.target.checked })} />
                                    <label className="form-check-label" htmlFor="ad_optimal">
                                        Advisory Optimal Yield
                                    </label>

                                </div>
                            </div>
                            <div className="row ">
                                <div className='col-lg-6 col-md-12 col-sm-6'>
                                    <input className="form-check-input me-2" type="checkbox" checked={formValues.ad_risk} id="ad_risk" onChange={e => setFormValues({ ...formValues, ad_risk: e.target.checked })} />
                                    <label className="form-check-label" htmlFor="ad_risk">
                                        Advisory Risk
                                    </label>

                                </div>
                                <div className='col-lg-6 col-md-12 col-sm-6' style={forWoreda ? { display: 'none' } : {}}>
                                    <input className="form-check-input me-2" type="checkbox" checked={formValues.ad_aclimate} id="ad_aclimate" onChange={e => setFormValues({ ...formValues, ad_aclimate: e.target.checked })} disabled={forWoreda} />
                                    <label className="form-check-label" htmlFor="ad_aclimate">
                                        Advisory Aclimate
                                    </label>

                                </div>
                            </div>
                            {!(formValues.ad_aclimate || formValues.ad_fertilizer || formValues.ad_optimal || formValues.ad_risk) &&
                                <div className="alert alert-danger mt-4" role="alert">
                                    You must select at least one layer of information
                                </div>
                            }

                        </div>



                        <div className='row'>
                            {
                                !isAdminSelectionComplete(formValues, forWoreda)
                                && <Alert />
                            }
                            {firstTimeSetup ? (
                                <div className="col d-flex justify-content-center mt-4 mb-4">
                                    <p className="text-muted mb-0 font-link-body">
                                        {isAdminSelectionComplete(formValues, forWoreda)
                                            ? 'Saving your location and returning to the home page…'
                                            : 'Complete the location above to return to the home page.'}
                                    </p>
                                </div>
                            ) : (
                                <Link className='col d-flex justify-content-center mt-4 mb-4' to={forWoreda ? "/report_woreda" : "/report"} style={verify() ? { "pointerEvents": 'none' } : {}} >
                                    <button type="submit" className="btn btn-primary" disabled={verify()} onClick={() => { dispatch(setReportInput({ formValues: { ...formValues, country: [country, id] } })); }}>Advisory</button>
                                </Link>
                            )}
                        </div>
                    </form>
                    <div className='col-md-6'>
                        {/* {geoJson ?
                            <Map id="location_report" init={map_init} type={"location_report"} geo={geoJson} bounds={bounds}/> : */}
                        <Map id="location" init={map_init} bounds={bounds} type={"location"} style={{ height: '450px' }} zoomOnGeojson={map_init} cuttable={false} checked={true} param={param} region={formValues.region} zone={formValues.zone} kebele={formValues.kebele} woreda={formValues.woreda} />
                        {/* } */}

                    </div>




                </div>

            </div>

            {
                /* 
                <div id="myCarousel" className="carousel slide" data-bs-ride="carousel">
                <div className="carousel-indicators">
                    <button type="button" data-bs-target="#myCarousel" data-bs-slide-to="0" aria-label="Slide 1" className="active" aria-current="true"></button>
                    <button type="button" data-bs-target="#myCarousel" data-bs-slide-to="1" aria-label="Slide 2" className=""></button>
                </div>
                <div className="carousel-inner">

                    <div className="carousel-item">
                        <svg className="bd-placeholder-img" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice" focusable="false"><rect width="100%" height="100%" fill="#777"></rect></svg>
                        <div className="container">
                            <div className="carousel-caption text-start">
                                <h1>Coalition of the Willing</h1>
                                <p>Powering data-driven solutions for Ethiopian agriculture (cgiar.org)</p>
                                <p></p>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#myCarousel" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#myCarousel" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
                */
            }



        </main>
    );
}

export default Home;