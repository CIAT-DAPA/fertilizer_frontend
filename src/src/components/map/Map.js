import React from 'react';
import L from "leaflet";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, ScaleControl, GeoJSON, Marker, Popup, useMapEvents} from 'react-leaflet';
import "leaflet-easyprint";
import GeoFeatures from '../../services/GeoFeatures';
import Configuration from "../../conf/Configuration";
import MapLegend from '../map_legend/MapLegend';
import ZoomControlWithReset from '../map_zoom_reset/ZoomControlWithReset';
import DrawControl from '../map_draw/DrawControl';
import './Map.css';

//For reset map view
const ETHIOPIA_BOUNDS = [  [10, 30],  [8.5, 50],];

const auxTableData = [];
const geoserverLayers = ["optimal_nutrients_n", 
        "optimal_nutrients_p", "yieldtypes_optimal", 
        "urea_probabilistic", "nps_probabilistic", 
        "vcompost_probabilistic", "compost_probabilistic", "dominant"];

//Current marker
var marker = null;

function Map(props) {

    const [nutrients_yield, setNutrients_yield] = React.useState(["n", "p", "optimal"]);
    const [compost, setCompost] = React.useState(["compost", "vcompost"]);
    const [fertilizer, setNutrients] = React.useState(["nps", "urea"]);
    const [currentLayer, setCurrentLayer] = React.useState();
    const [warning, setWarning] = React.useState(false);
    const [messageWarning, setMessageWarning] = React.useState("")
    const [polygonCoords, setPolygonCoords] = React.useState();
    const [mapRef, setRefMap] = React.useState();
    //For changing the layer according to scenerario selected (Sidebar)
    const [lastSelected, setLastSelected] = React.useState();
    const [selectedFeature, setSelectedFeature] = React.useState(null);

    const { BaseLayer } = LayersControl;
    const icon = L.icon({iconSize: [25, 41],iconAnchor: [10, 41],popupAnchor: [2, -40],iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png"});
    const request = Configuration.get_raster_crop_url();
    let layerType;

    

    var paramIdFilter;

    React.useEffect(() => {
        
        if(polygonCoords && currentLayer){
            try {
                const geoserver = Configuration.get_geoserver_url()
                const workspace = Configuration.get_fertilizer_worspace()
                let parameters = { minx: polygonCoords._southWest.lng, miny: polygonCoords._southWest.lat, maxx: polygonCoords._northEast.lng, maxy: polygonCoords._northEast.lat, layer: "et_" + props.crop + "_" + currentLayer + "_" + props.scenario }
                let requestFormatted = `${geoserver}${workspace}/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${workspace}:${parameters["layer"]}&format=image/tiff&subset=time("${props.forecast}-01T00:00:00.000Z")&subset=Lat(${parameters["miny"]},${parameters["maxy"]})&subset=Long(${parameters["minx"]},${parameters["maxx"]})`
                fetch(requestFormatted)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${parameters["layer"]}.tif`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        setWarning(false);
                    })
                    .catch(error => {
                        console.error('There was a problem with the network response:', error);
                        setMessageWarning("There was a problem with the download, please check the coordinates. ")
                        setWarning(true);
                    });
            } catch (error) {
                console.error("There was a problem: ", error)
                setMessageWarning("To download the clipping of a raster you must select a layer first")
                setWarning(true);
            }
        }else if(polygonCoords && !currentLayer){
            setMessageWarning("To download the clipping of a raster you must select a layer first")
            setWarning(true);
        }

    
    }, [polygonCoords]);

    function getUrlService(workspace, service){
        return Configuration.get_geoserver_url()+workspace+'/'+service
    }

    //For changing Map legend and popup message according to each layer (each one uses differents colors and values)
    const onLayerChange = (currentLayerName) => {

        for(let i = 0; i < geoserverLayers.length; i++) {
            if(currentLayerName.includes(geoserverLayers[i])) {
                setCurrentLayer(geoserverLayers[i]);
                break;
            }
        }
    }

    const Markers = e => {

        const map = useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                //Just one marker at once
                if (map) {
                    map.eachLayer((layer) => {
                        if (layer instanceof L.Marker) {
                            map.removeLayer(layer);
                        }
                    });
                }
                    
                // The object map has many layers. By default OSM is 35, but custom layers have different ids
                Object.keys(map._layers).forEach(function(key,index) {
                    if(map._layers[key].wmsParams !== undefined){
                        //Yield layer name
                        const layer_name = map._layers[key].options.layers;

                        const popUpMessage = (layer_name.includes("optimal_nutrients")) ? "optimal nutrient amount: ": 
                        (layer_name.includes("yieldtypes")) ? "optimal yield amount: " : 
                        (layer_name.includes(geoserverLayers[3]) || layer_name.includes(geoserverLayers[4])) ? "fertilizer amount: " : 
                        (layer_name.includes(geoserverLayers[5])) ? "vermi-compost: " : 
                        (layer_name.includes(geoserverLayers[6])) ? "compost: " : "" 
                    
                        const unitPopupMessage = popUpMessage===""?"": (layer_name.includes(geoserverLayers[5]) || layer_name.includes(geoserverLayers[6])) ? " ton/ha" : " kg/ha";
                        
                        if (props.type.includes("report")) {
                        
                            //Making a popup
                            GeoFeatures.get_value(layer_name,lat,lng, props.forecast)
                            .then((data)=>{ 
                                if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0 && popUpMessage != "") {
                                    
                                    marker = L.marker([lat, lng], { icon }).addTo(map)
                                        .bindPopup(popUpMessage + data.features[0].properties.GRAY_INDEX.toFixed(2) + unitPopupMessage)
                                        .openPopup();
                                        auxTableData[2] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                        if(layer_name.includes(geoserverLayers[2])){
                                            props.setTableData({n: auxTableData[0], p: auxTableData[1], yieldData: auxTableData[2]})
                                        }
                                }
                            });
                        }else{
                            if((layer_name.includes(geoserverLayers[2])) || (layer_name.includes(geoserverLayers[1])) || (layer_name.includes(geoserverLayers[0]))){
                                //Getting N data  	fertilizer_et:et_wheat_optimal_nutrients_n_normal 
                                let nLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[0]+"_"+props.scenario
                                GeoFeatures.get_value(nLayer,lat,lng, props.forecast).then((data)=>{
                                    if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0) {
                                        auxTableData[0] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                        
                                        //Getting P data
                                        let pLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[1]+"_"+props.scenario
                                        GeoFeatures.get_value(pLayer,lat,lng, props.forecast).then((data)=>{
                                            if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0) {
                                                auxTableData[1] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                            }
                                            let oLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[2]+"_"+props.scenario
                                            GeoFeatures.get_value(oLayer,lat,lng, props.forecast).then((data)=>{
                                                if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0) {
                                                    auxTableData[2] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                                }
                                                marker = L.marker([lat, lng], { icon }).addTo(map)
                                                    .bindPopup(`optimal N amount: ${auxTableData[0]} ${unitPopupMessage} <br/>
                                                    optimal P amount: ${auxTableData[1]} ${unitPopupMessage}<br/>
                                                    optimal yield amount: ${auxTableData[2]} ${unitPopupMessage}`)
                                                    .openPopup();
                                            });
                                        });
                                    }
                                });
                            }

                            if((layer_name.includes(geoserverLayers[3])) || (layer_name.includes(geoserverLayers[4]))){
                                //Getting urea data  	fertilizer_et:et_wheat_optimal_nutrients_n_normal 
                                let ureaLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[3]+"_"+props.scenario
                                GeoFeatures.get_value(ureaLayer,lat,lng, props.forecast).then((data)=>{
                                    if(data.features[0]?.properties.GRAY_INDEX.toFixed(2) > 0) {
                                        auxTableData[3] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                    }
                                    //Getting nps data
                                    let npsLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[4]+"_"+props.scenario
                                        GeoFeatures.get_value(npsLayer,lat,lng, props.forecast).then((data)=>{
                                            if(data.features[0] && data.features[0]?.properties.GRAY_INDEX.toFixed(2) > 0) {
                                                auxTableData[4] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                            }
                                            marker = L.marker([lat, lng], { icon }).addTo(map)
                                                .bindPopup(`fertilizer Urea amount: ${auxTableData[3]} ${unitPopupMessage} <br/>
                                                fertilizer NPS amount: ${auxTableData[4]} ${unitPopupMessage}`)
                                                .openPopup(); 
                                        });
                                });
                            }

                            if((layer_name.includes(geoserverLayers[5])) || (layer_name.includes(geoserverLayers[6]))){
                                //Getting vcompos data  	fertilizer_et:et_wheat_optimal_nutrients_n_normal 
                                let nLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[5]+"_"+props.scenario
                                GeoFeatures.get_value(nLayer,lat,lng, props.forecast).then((data)=>{
                                    if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0) {
                                        auxTableData[5] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                    }
                                    //Getting compos data
                                    let pLayer = "fertilizer_et:et_"+props.crop+"_"+geoserverLayers[6]+"_"+props.scenario
                                    GeoFeatures.get_value(pLayer,lat,lng, props.forecast).then((data)=>{
                                        if(data.features[0] && data.features[0].properties.GRAY_INDEX.toFixed(2) > 0) {
                                            auxTableData[6] = data.features[0].properties.GRAY_INDEX.toFixed(2);
                                        }
                                        marker = L.marker([lat, lng], { icon }).addTo(map)
                                            .bindPopup(`vermi-compost: ${auxTableData[5]} ${unitPopupMessage} <br/>
                                            compost: ${auxTableData[6]} ${unitPopupMessage}`)
                                            .openPopup();
                                            
                                    });
                            
                                });

                            }
                        }
                        
                    }
                    
                });
            }
        })
        
       
    }
    
    React.useEffect(() => {
        if (mapRef)
        mapRef.target.flyToBounds(props.bounds)
    },[props.bounds])

    const handleEventsMap = (map) => {

        // Adding print/export button on the map
        if(props.downloadable){
            L.easyPrint({
                title: 'Download map',
                position: 'topright',
                sizeModes: ['Current', 'A4Portrait', 'A4Landscape'],
                exportOnly: true, //If false it will print
                hideControlContainer: true
                
            }).addTo(map.target);
           
        }

        if (props.bounds){
            map.target.flyToBounds(props.bounds)
        }

        setRefMap(map);
        

    };

    const highlightFeature = (e) => {
        const layer = e.target;
        const properties = layer.feature.properties.name_adm4;
        setSelectedFeature(properties);
        //layer.setStyle({ weight: 2, color: '#666', dashArray: '', fillOpacity: 0.5 });
        //layer.bindPopup(`<pre>${JSON.stringify(properties, null, 4)}</pre>`).openPopup();
    };
    
    const resetHighlight = (e) => {
        const layer = e.target;
        //layer.setStyle({ weight: 1, color: '#3388ff', dashArray: '3', fillOpacity: 0.2 });
        setSelectedFeature(null);
    };
    
    const onEachFeature = (feature, layer) => {
        if (props.type.includes('woreda')){
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
            });
        }
    };

    return (
        <>
            {
                warning && <div class="alert alert-warning text-center" role="alert">
                                {messageWarning}
                            </div>

            }
        
            <MapContainer id={props.type} zoomSnap={0.25} zoomDelta={0.25} center={props.init.center} zoom={props.init.zoom} zoomControl={false} style={props.style} scrollWheelZoom={true} whenReady={handleEventsMap} renderer={L.canvas()}>
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    
                />
                {props.type === "nutrients_yield" ?
                    <LayersControl position="topright" collapsed={false}>{
                        nutrients_yield.map((item) => {
                            return <BaseLayer key={"nutrients_yield_" + item} name={item==="optimal"?"optimal yield":item} checked={item===lastSelected?true:false}> 
                    
                                {
                                    layerType = (item === "optimal")?"_yieldtypes_":"_optimal_nutrients_"
                                }
                                
                    
                                <WMSTileLayer
                                    key={"fertilizer_et:et_" + props.crop + layerType  + item +"_"+ props.scenario}
                                    layers={"fertilizer_et:et_" + props.crop + layerType  + item +"_"+ props.scenario}
                                    attribution=''
                                    url={getUrlService('fertilizer_et', 'wms')}
                                    format={"image/png"}
                                    transparent={true}
                                    params={{'time': props.forecast}}
                                    eventHandlers={{
                                        add: (e) => {
                                          onLayerChange(e.target.options.layers);
                                          setLastSelected(item);
                                          
                                        }
                                      }}
                                    
                                />
                            </BaseLayer>
                        })}                        
                    </LayersControl>
                    : props.type === "nps_urea" ?
                        <LayersControl position="topright" collapsed={false}>{
                            fertilizer.map((item) => {
                                return <BaseLayer key={"nps_urea" + item} name={item} checked={item===lastSelected?true:false}>
                                   
                                    <WMSTileLayer
                                        key={"fertilizer_et:et_" + props.crop + "_"+ item + "_probabilistic_" +props.scenario}
                                        layers={"fertilizer_et:et_" + props.crop + "_"+ item + "_probabilistic_" +props.scenario}
                                        attribution=''
                                        url={getUrlService('fertilizer_et', 'wms')}
                                        format={"image/png"}
                                        transparent={true}
                                        params={{'time': props.forecast}}
                                        eventHandlers={{
                                            add: (e) => {
                                              onLayerChange(e.target.options.layers);
                                              setLastSelected(item);
                                            }
                                          }}
                                    />
                                </BaseLayer>
                            })}
                        </LayersControl>
                    : props.type === "compost" ?
                        <LayersControl position="topright" collapsed={false}>
                            {compost.map((item) => {
                                return <BaseLayer key={"compost_" + item} name={item} checked={item===lastSelected?true:false}>
                                    <WMSTileLayer
                                        key={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" +props.scenario}
                                        layers={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" +props.scenario}
                                        attribution=''
                                        url={getUrlService('fertilizer_et', 'wms')}
                                        format={"image/png"}
                                        transparent={true}
                                        params={{'time': props.forecast}}
                                        eventHandlers={{
                                            add: (e) => {
                                              onLayerChange(e.target.options.layers);
                                              setLastSelected(item);
                                            }
                                          }}
                                    />
                                </BaseLayer>
                            })}
                        </LayersControl>
                    : props.type === "location" ? (
                        props.kebele ?
                            <WMSTileLayer
                                key={props.kebele}
                                layers={"administrative:et_adm4"}
                                attribution=''
                                url={getUrlService('administrative', 'wms')}
                                format={"image/png"}
                                transparent={true}
                                styles='Etiopia_Admin_Styles'
                                cql_filter= {`id_adm4=${props.param}`}
                            />
                        : props.woreda ?
                            <WMSTileLayer
                                key={props.woreda}
                                layers={"administrative:et_adm4"}
                                attribution=''
                                url={getUrlService('administrative', 'wms')}
                                format={"image/png"}
                                transparent={true}
                                styles='Etiopia_Admin_Styles'
                                cql_filter= {`id_adm3=${props.param}`}
                            />
                        : props.zone ? 
                            <WMSTileLayer
                                key={props.zone}
                                layers={"administrative:et_adm3"}
                                attribution=''
                                url={getUrlService('administrative', 'wms')}
                                format={"image/png"}
                                transparent={true}
                                styles='Etiopia_Admin_Styles'
                                cql_filter= {`ADM2_PCODE='ET${props.param.length == 4 ? props.param : "0" + props.param}'`}
                            />
                        : props.region ?
                            <WMSTileLayer
                                key={props.region}
                                layers={"administrative:et_adm2"}
                                attribution=''
                                url={getUrlService('administrative', 'wms')}
                                format={"image/png"}
                                transparent={true}
                                styles='Etiopia_Admin_Styles'
                                cql_filter= {`ADM1_PCODE='ET${props.param.length == 2 ? props.param : "0" + props.param}'`}
                            />
                        :
                        <WMSTileLayer
                            layers={"administrative:et_adm1"}
                            attribution=''
                            url={getUrlService('administrative', 'wms')}
                            format={"image/png"}
                            transparent={true}
                            styles='Etiopia_Admin_Styles'
                        />)
                    : props.type === "seasonal_dominant" ?
                        <LayersControl position="topright" collapsed={false}>   
                            <BaseLayer key={props.type} name={"dominant"} checked={props.checked}>
                                <WMSTileLayer
                                    layers={"aclimate_et:seasonal_country_et_dominant"}
                                    attribution=''
                                    url={getUrlService('aclimate_et', 'wms')}
                                    format={"image/png"}
                                    transparent={true}
                                    // params={{'time': props.forecast}}
                                    eventHandlers={{
                                        add: (e) => {
                                            onLayerChange(e.target.options.layers);
                                            
                                        }
                                        }}
                                />
                            </BaseLayer>
                        </LayersControl> 
                    : props.type.includes("recommendation_report") ?
                        <LayersControl position="topright" collapsed={true}>
                            {props.scenarios.map(scenario => {
                                return <BaseLayer key={scenario} name={scenario} checked={scenario === 'normal'} >
                                    <WMSTileLayer
                                        key={`fertilizer_et:et_${props.crop}_yieldtypes_optimal_${scenario}`}
                                        layers={`fertilizer_et:et_${props.crop}_yieldtypes_optimal_${scenario}`}
                                        attribution=''
                                        url={getUrlService('fertilizer_et', 'wms')}
                                        format={"image/png"}
                                        transparent={true}
                                        params={{ 'time': props.forecast }}
                                        eventHandlers={{
                                            add: (e) => {
                                                onLayerChange(e.target.options.layers);
                                                setLastSelected("optimal");
                                            }
                                        }}

                                    />

                                </BaseLayer>
                            })}
                        </LayersControl>
                    : props.type.includes("nps_urea_report") ?
                        <LayersControl position="topright" collapsed={true}>
                            {fertilizer.map((item) => {
                                return props.scenarios.map(scenario => {
                                    return <BaseLayer key={`${item}_${scenario}`} name={`${item} ${scenario}`} checked={(item === "nps" && scenario === "normal")}>

                                        <WMSTileLayer
                                            key={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" + scenario}
                                            layers={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" + scenario}
                                            attribution=''
                                            url={getUrlService('fertilizer_et', 'wms')}
                                            format={"image/png"}
                                            transparent={true}
                                            params={{ 'time': props.forecast }}
                                            eventHandlers={{
                                                add: (e) => {
                                                    onLayerChange(e.target.options.layers);
                                                    setLastSelected(item);
                                                }
                                            }}
                                        />
                                    </BaseLayer>
                                })
                            })}
                        </LayersControl>
                    : props.type.includes("compost_report") &&
                        <LayersControl position="topright" collapsed={true}>
                            {compost.map((item) => {
                                return props.scenarios.map(scenario => {
                                    return <BaseLayer key={`${item}_${scenario}`}  name={`${item} ${scenario}`} checked={(item === "compost" && scenario === "normal")}>

                                        <WMSTileLayer
                                            key={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" + scenario}
                                            layers={"fertilizer_et:et_" + props.crop + "_" + item + "_probabilistic_" + scenario}
                                            attribution=''
                                            url={getUrlService('fertilizer_et', 'wms')}
                                            format={"image/png"}
                                            transparent={true}
                                            params={{ 'time': props.forecast }}
                                            eventHandlers={{
                                                add: (e) => {
                                                    onLayerChange(e.target.options.layers);
                                                    setLastSelected(item);
                                                }
                                            }}
                                        />
                                    </BaseLayer>
                                })
                            })} 
                        </LayersControl>
                }
                {
                    props.legend &&
                        <MapLegend currentLayer={currentLayer} geoserverLayers={geoserverLayers} crop={props.crop} scenario={props.scenario}/>
                }
                <Markers />
                <ScaleControl position="bottomleft" />
                <div className="leaflet-top leaflet-left">
                    <ZoomControlWithReset bounds={props.bounds? props.bounds: ETHIOPIA_BOUNDS} />
                </div>
                {
                    props.cuttable && 
                        <DrawControl
                        setPolygonCoords={setPolygonCoords}
                        />
                }
                {selectedFeature && (
                    <div className="info-label">
                        <span className='text-uppercase'>{selectedFeature}</span>
                    </div>
                )}
                {
                props.geo ? <GeoJSON attribution="" key={"advisory_geojson"+props.geo.timeStamp} data={props.geo} style={props.styleGeojson} onEachFeature={onEachFeature} on/> : <GeoJSON attribution="" />
                }
            </MapContainer>
           
        </>
    );


}

export default Map;