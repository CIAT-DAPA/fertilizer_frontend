import React from 'react';
import PartnerCard from '../../components/partner/PartnerCard';
import { ETHIOPIA_PARTNERS, PARTNERS_INTRO } from '../../config/partnersConfig';
import './Partners.css';

function Partners() {
  return (
    <div className="partners-page">
      <header className="partners-hero" aria-labelledby="partners-hero-title">
        <div className="partners-hero__mesh" aria-hidden="true" />
        <div className="partners-hero__inner">
          <p className="partners-hero__eyebrow">
            <i className="bi bi-people-fill" aria-hidden="true" />
            Collaboration
          </p>
          <h1 id="partners-hero-title" className="partners-hero__title">
            Our <span className="partners-hero__highlight">partners</span>
          </h1>
          <p className="partners-hero__text">{PARTNERS_INTRO}</p>
          <div className="partners-hero__stats" aria-label="Partner summary">
            <span className="partners-hero__stat">
              <strong>{ETHIOPIA_PARTNERS.length}</strong> organizations
            </span>
            <span className="partners-hero__stat">
              <strong>1</strong> country focus
            </span>
          </div>
        </div>
      </header>

      <main className="partners-main">
        <section className="partners-section" aria-labelledby="partners-ethiopia-title">
          <div className="partners-section__head">
            <h2 id="partners-ethiopia-title" className="partners-section__title">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              Ethiopia
            </h2>
            <p className="partners-section__sub">
              National and international institutions supporting HaFAS
            </p>
          </div>

          <ul className="partners-grid">
            {ETHIOPIA_PARTNERS.map((partner, index) => (
              <li key={partner.id}>
                <PartnerCard partner={partner} index={index} />
              </li>
            ))}
          </ul>
        </section>

        <p className="partners-footer-note">
          Logos link to each organization&apos;s website. HaFAS is a collaborative initiative of the
          Alliance of Bioversity International and CIAT with national and CGIAR partners.
        </p>
      </main>
    </div>
  );
}

export default Partners;
