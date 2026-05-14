import React from 'react';

import './About.css';

function About() {

    return (
        <section className='d-flex h-100 text-center container'>
            <div className='row mt-4 mb-5'>
                <main className='px-3'>
                    <h2 className='font-link'>About us</h2>
                    <br/>
                    <p className='font-link-body'>
                    HaFAS Agro-Advisory Platform is a nationally coordinated digital agriculture initiative designed to deliver site-, context-, and climate-specific agricultural advisory services in Ethiopia. The platform provides data-driven recommendations on fertilizer application, integrated soil fertility management (ISFM), climate information services, climate-smart agriculture (CSA), lime application, and other crop-specific agronomic solutions to support sustainable agricultural productivity and resilience.
                        <br />
                        <br />
                        The platform is developed through collaboration among the Alliance of Bioversity International and CIAT, national and international partners, and CGIAR initiatives, with support from SSHI (GIZ-Ethiopia), BMGF, EiA (oneCGIAR initiative), and AICCRA (World Bank).
                    </p>
                    
                    <br/>
                    <br/>
                    <br/>
                </main>
            </div>
        </section>
    );
}

export default About;