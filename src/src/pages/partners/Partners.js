import CountryPartner from '../../components/country_partner/CountryPartner';
//import './Partners.css'
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Footer from "../../components/footer/Footer";

const URL_PARTNERS_DATA =
    "https://raw.githubusercontent.com/CIAT-DAPA/fertilizer_frontend/develop/src/src/assets/partners/partners.csv";

function Partners() {
    //Translation
    //const [t, i18n] = useTranslation("global");
    const [groupedPartners, setGroupedPartners] = useState({});


    useEffect(() => {
        Papa.parse(URL_PARTNERS_DATA, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                const grouped = results.data.reduce((acc, partner) => {
                    const country = partner.Pais;
                    if (!acc[country]) {
                        acc[country] = [];
                    }
                    acc[country].push(partner);
                    return acc;
                }, {});
                setGroupedPartners(grouped);

            },
        });
    }, []);

    return (
        <div>
            <div className="mb-4 text-white bg-title">
                <div className="container pb-3 px-4 container-news" style={{}}>
                    <div className="col-md-6 px-0">
                        <h1 className="display-4">
                            Partners
                        </h1>
                    </div>
                </div>
            </div>
            <div className='px-5'>
                {['Ethiopia']
                    .map((country) => {
                        if (!groupedPartners[country]) {
                            return null;
                        }
                        return <CountryPartner key={country} country={country} partners={groupedPartners[country]} />
                    })}
            </div>
        </div >
    );
}

export default Partners;