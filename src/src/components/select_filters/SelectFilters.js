import React from 'react';
import Select from 'react-select';
import infoIcon from '../../assets/icons/info-icon.svg';

import './SelectFilters.css';

function SelectFilters(props) {

    return (
        <div className='d-flex justify-content-start'>
            <div className='d-flex justify-content-end font-link-body flex-wrap align-items-center'>
                <h5 className='p-2 bd-highlight mt-2'>Crop</h5>
                <div className='p-2 bd-highlight select'>
                    <Select 
                        defaultValue={props.opt_crops[0]}
                        options={props.opt_crops}
                        onChange={props.onChangeCrop}
                        menuPortalTarget={document.body} 
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
                </div>
            </div>

            <div className='d-flex justify-content-end font-link-body flex-wrap align-items-center'>
                <h5 className='p-2 bd-highlight mt-2'>Forecast date</h5>
                <div className='p-2 bd-highlight select'>
                    <Select defaultValue={props.opt_forecast.at(-1)}
                        options={props.opt_forecast}
                        onChange={props.onChangeForecast}
                        menuPortalTarget={document.body} 
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
                </div>
            </div>
        </div>
    );
}

export default SelectFilters;