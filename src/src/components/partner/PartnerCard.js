import React from 'react';
import { partnerLogoSrc } from '../../config/partnersConfig';
import './PartnerCard.css';

function PartnerCard({ partner, index = 0 }) {
  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="partner-card"
      style={{ '--partner-delay': `${index * 0.05}s` }}
      aria-label={`${partner.name} — opens in a new tab`}
    >
      <span className="partner-card__logo-wrap">
        <img
          className="partner-card__logo"
          src={partnerLogoSrc(partner.logo)}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="partner-card__name">{partner.name}</span>
      <span className="partner-card__link">
        Visit site <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
      </span>
    </a>
  );
}

export default PartnerCard;
