import CountryPartner from '../../components/countryPartner/CountryPartner';
import './Partners.css'
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { useTranslation } from "react-i18next"
import Footer from "../../components/footer/Footer";

const URL_PARTNERS_DATA =
    "https://raw.githubusercontent.com/CIAT-DAPA/aclimate_site/main/data/partners.csv";

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
                            {t("partners.partners-title")}
                        </h1>
                    </div>
                </div>
            </div>
            <div className='px-5'>
                {['Colombia', 'Ethiopia', 'Angola', 'Guatemala', 'Perú']
                    .map((country) => {
                        if (!groupedPartners[country]) {
                            return null;
                        }
                        return <CountryPartner key={country} country={country} partners={groupedPartners[country]} />
                    })}
            </div>
            <Footer></Footer>
        </div >
    );
}

export default Partners;