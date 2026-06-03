import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const CAPABILITIES = [
  {
    icon: 'bi-droplet-half',
    title: 'Fertilizer advisories',
    description:
      'Location-specific recommendations for nitrogen, phosphorus, NPS, urea, and optimal yield using probabilistic maps and machine learning.',
  },
  {
    icon: 'bi-recycle',
    title: 'Integrated soil fertility (ISFM)',
    description:
      'Guidance on compost and vermi-compost to complement mineral fertilizers and support long-term soil health.',
  },
  {
    icon: 'bi-cloud-sun',
    title: 'Climate & agroclimate',
    description:
      'Climate information services and climate-smart agriculture options aligned with seasonal forecasts and local conditions.',
  },
  {
    icon: 'bi-layers',
    title: 'Lime & soil acidity',
    description:
      'Recommendations for managing soil acidity through lime application where agronomically appropriate.',
  },
  {
    icon: 'bi-file-earmark-pdf',
    title: 'Reports & metrics',
    description:
      'Kebele- and woreda-level PDF reports with charts, maps, and a metrics preview tied to the same advisory data.',
  },
  {
    icon: 'bi-robot',
    title: 'AI chatbot',
    description:
      'Interactive assistant for layer lookup, coordinate-based queries, and batch processing of advisory requests.',
  },
];

const AUDIENCES = [
  {
    icon: 'bi-person-workspace',
    title: 'Extension agents',
    description: 'Deliver consistent, data-backed advice during field visits and farmer training.',
  },
  {
    icon: 'bi-house-door',
    title: 'Farmers & cooperatives',
    description: 'Access clear recommendations for fertilizer, soil fertility, and climate-smart practices.',
  },
  {
    icon: 'bi-mortarboard',
    title: 'Researchers',
    description: 'Explore spatial advisories, methodology, and underlying data sources for analysis.',
  },
  {
    icon: 'bi-building',
    title: 'Policymakers',
    description: 'Support planning and monitoring with harmonized, nationally coordinated advisory intelligence.',
  },
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Select your location',
    description:
      'Choose Ethiopia and drill down through region, zone, woreda, and kebele—or use woreda-level reporting where applicable.',
  },
  {
    step: 2,
    title: 'Explore advisories',
    description:
      'Open maps and modules for nutrients, ISFM, agroclimate, lime, and other crop-specific tools from the dashboard.',
  },
  {
    step: 3,
    title: 'Act on insights',
    description:
      'Generate PDF reports, preview metrics, or use the chatbot for targeted lookups and batch coordinate queries.',
  },
];

function About() {
  return (
    <div className="about-page">
      <header className="about-hero" aria-labelledby="about-hero-title">
        <div className="about-hero__mesh" aria-hidden="true" />
        <div className="about-hero__inner">
          <p className="about-hero__eyebrow">
            <i className="bi bi-info-circle-fill" aria-hidden="true" />
            About HaFAS
          </p>
          <h1 id="about-hero-title" className="about-hero__title">
            Harmonized Digital{' '}
            <span className="about-hero__highlight">Fertilizer &amp; Agronomic Solutions</span>
          </h1>
          <p className="about-hero__text">
            HaFAS is a nationally coordinated digital agriculture platform for Ethiopia. It delivers
            context-specific, climate-smart, and data-driven agronomic advisory services by combining
            geospatial intelligence, soil and crop analytics, machine learning, and local agronomic
            expertise.
          </p>
          <div className="about-hero__actions">
            <Link className="about-btn about-btn--primary" to="/dashboard">
              <i className="bi bi-grid-1x2-fill" aria-hidden="true" />
              Open dashboard
            </Link>
            <Link className="about-btn about-btn--ghost" to="/methodology">
              <i className="bi bi-journal-bookmark" aria-hidden="true" />
              View methodology
            </Link>
          </div>
        </div>
      </header>

      <main className="about-main">
        <section className="about-panel" aria-labelledby="about-mission-title">
          <div className="about-section__head">
            <h2 id="about-mission-title" className="about-section__title">
              <i className="bi bi-bullseye" aria-hidden="true" />
              Our mission
            </h2>
          </div>
          <div className="about-prose">
            <p>
              The HaFAS Advisory Platform transforms fertilizer and agronomic science into actionable
              insights for Ethiopia&apos;s diverse farming systems. Recommendations are tailored to
              administrative units—from country down to kebele—and account for seasonal forecasts,
              soil conditions, and selected advisory layers such as fertilizer, optimal yield, and
              climate risk.
            </p>
            <p>
              By integrating advanced analytics, artificial intelligence, geospatial data, and
              national research partnerships, HaFAS supports improved productivity, soil health, and
              resilience while scaling farmer-centered digital extension across the country.
            </p>
          </div>
        </section>

        <section className="about-panel" aria-labelledby="about-capabilities-title">
          <div className="about-section__head">
            <h2 id="about-capabilities-title" className="about-section__title">
              <i className="bi bi-grid-3x3-gap-fill" aria-hidden="true" />
              What you can do
            </h2>
            <p className="about-section__sub">
              Core capabilities available through the workspace and advisory modules
            </p>
          </div>
          <ul className="about-grid about-grid--3">
            {CAPABILITIES.map((item) => (
              <li key={item.title} className="about-card">
                <span className="about-card__icon" aria-hidden="true">
                  <i className={`bi ${item.icon}`} />
                </span>
                <h3 className="about-card__title">{item.title}</h3>
                <p className="about-card__text">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-panel" aria-labelledby="about-audience-title">
          <div className="about-section__head">
            <h2 id="about-audience-title" className="about-section__title">
              <i className="bi bi-people-fill" aria-hidden="true" />
              Who it serves
            </h2>
            <p className="about-section__sub">
              Designed for everyone involved in agricultural decision-making in Ethiopia
            </p>
          </div>
          <ul className="about-grid about-grid--4">
            {AUDIENCES.map((item) => (
              <li key={item.title} className="about-card about-card--compact">
                <span className="about-card__icon about-card__icon--sm" aria-hidden="true">
                  <i className={`bi ${item.icon}`} />
                </span>
                <h3 className="about-card__title">{item.title}</h3>
                <p className="about-card__text">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-panel about-panel--steps" aria-labelledby="about-workflow-title">
          <div className="about-section__head">
            <h2 id="about-workflow-title" className="about-section__title">
              <i className="bi bi-signpost-split-fill" aria-hidden="true" />
              How it works
            </h2>
            <p className="about-section__sub">A simple workflow from location selection to action</p>
          </div>
          <ol className="about-steps">
            {WORKFLOW_STEPS.map((item) => (
              <li key={item.step} className="about-steps__item">
                <span className="about-steps__num" aria-hidden="true">
                  {item.step}
                </span>
                <div className="about-steps__body">
                  <h3 className="about-steps__title">{item.title}</h3>
                  <p className="about-steps__text">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-cta" aria-labelledby="about-collab-title">
          <div className="about-cta__copy">
            <h2 id="about-collab-title" className="about-cta__title">
              Built through collaboration
            </h2>
            <p className="about-cta__text">
              HaFAS is developed by the Alliance of Bioversity International and CIAT together with
              national institutions, CGIAR centers, and development partners—including support from
              SSHI (GIZ-Ethiopia), the Bill &amp; Melinda Gates Foundation, Excellence in Agronomy
              (EiA), and AICCRA (World Bank).
            </p>
          </div>
          <div className="about-cta__actions">
            <Link className="about-btn about-btn--primary" to="/partners">
              <i className="bi bi-people" aria-hidden="true" />
              Meet our partners
            </Link>
            <Link className="about-btn about-btn--outline" to="/">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              Select location
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default About;
