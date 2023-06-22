import React from 'react';

import './MapLegend.css';

function MapLegend(props) {
    const [photo, setPhoto] = React.useState();

    React.useEffect(() => {
          const image = `https://geo.aclimate.org/geoserver/fertilizer_et/wms?REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&WIDTH=15&HEIGHT=15&LAYER=fertilizer_et:et_${props.crop}_${props.currentLayer}_${props.scenario}&Transparent=True&LEGEND_OPTIONS=dx:3;fontName:Helvetica`
          setPhoto(image)
           
        }, [props.currentLayer, props.crop, props.scenario])

    return (
        <div className={"leaflet-bottom leaflet-right"}>
            <div className="leaflet-control leaflet-bar">
                {props?.currentLayer &&
                    <div className='info legend'>
                        {
                            (props?.currentLayer && props?.currentLayer.includes(props.geoserverLayers[7])) ? <h6>scenaries</h6> :
                                <h6>amounts {props?.currentLayer?.includes(props?.geoserverLayers[5]) || props?.currentLayer?.includes(props?.geoserverLayers[6]) ? "(ton/ha)" : "(kg/ha)"}</h6>
                        }
                        <img src={photo}></img>

                    </div>
                }
                
            </div>
        </div>
    );
}

export default MapLegend;