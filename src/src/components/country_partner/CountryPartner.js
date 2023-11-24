import "./CountryPartner.css"
import { Row } from "react-bootstrap";
import React, { useEffect, useRef } from 'react';
import Partner from "../partner/Partner";

function CountryPartner(props) {

    const hiddenElement = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show-title');
                }
            });
        });

        observer.observe(hiddenElement.current);
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="mb-4">

            <h2 className="border-3 border-bottom hidden-title" ref={hiddenElement}>{props.country}</h2>
            <Row className="row-cols-1 row-cols-sm-2 row-cols-md-3 g-3 px-3 d-flex justify-content-between">
                {props.partners.map((partner, index) => {
                    return (
                        <Partner key={index} partner={partner} delay={index * 300}></Partner>
                    );
                })}
            </Row>
        </div>
    )
}

export default CountryPartner;