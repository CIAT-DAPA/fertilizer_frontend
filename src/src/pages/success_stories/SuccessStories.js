import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SUCCESS_STORIES,
  SUCCESS_STORIES_INTRO,
  farmerPhotoUrl,
} from '../../config/successStoriesConfig';
import './SuccessStories.css';

function FarmerPhoto({ firstName, name }) {
  const [failed, setFailed] = useState(false);
  const initials = firstName?.charAt(0)?.toUpperCase() || '?';

  if (failed) {
    return (
      <div className="ss-story__avatar-fallback" aria-hidden="true">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={farmerPhotoUrl(firstName)}
      alt={`Portrait of ${name}`}
      className="ss-story__photo"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StoryCard({ story, index }) {
  const reversed = index % 2 === 1;

  return (
    <article
      className={`ss-story${reversed ? ' ss-story--reverse' : ''}${story.metrics ? ' ss-story--featured' : ''}`}
      aria-labelledby={`ss-story-title-${story.id}`}
    >
      <div className="ss-story__media">
        <div className="ss-story__photo-wrap">
          <FarmerPhoto firstName={story.firstName} name={story.name} />
          <span className="ss-story__photo-ring" aria-hidden="true" />
        </div>
        {story.highlight && (
          <span className="ss-story__badge">
            <i className="bi bi-graph-up-arrow" aria-hidden="true" />
            {story.highlight}
          </span>
        )}
      </div>

      <div className="ss-story__body">
        <div className="ss-story__meta">
          <span className="ss-story__crop">
            <i className="bi bi-flower1" aria-hidden="true" />
            {story.crop}
          </span>
          <span className="ss-story__location">
            <i className="bi bi-geo-alt" aria-hidden="true" />
            {story.location}
          </span>
        </div>

        <blockquote className="ss-story__quote">
          <span className="ss-story__quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          <p>{story.quote}</p>
        </blockquote>

        {story.metrics && (
          <dl className="ss-story__metrics" aria-label="Yield comparison">
            {story.metrics.map((metric) => (
              <div key={metric.label} className="ss-story__metric">
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <footer className="ss-story__footer">
          <div>
            <h2 id={`ss-story-title-${story.id}`} className="ss-story__name">
              {story.name}
            </h2>
            <p className="ss-story__role">{story.role}</p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function SuccessStories() {
  return (
    <div className="ss-page">
      <header className="ss-hero" aria-labelledby="ss-hero-title">
        <div className="ss-hero__mesh" aria-hidden="true" />
        <div className="ss-hero__grain" aria-hidden="true" />
        <div className="ss-hero__inner">
          <p className="ss-hero__eyebrow">
            <i className="bi bi-stars" aria-hidden="true" />
            Voices from the field
          </p>
          <h1 id="ss-hero-title" className="ss-hero__title">
            Success <span className="ss-hero__highlight">stories</span>
          </h1>
          <p className="ss-hero__text">{SUCCESS_STORIES_INTRO}</p>
          <div className="ss-hero__stats" aria-label="Story highlights">
            <span className="ss-hero__stat">
              <strong>SSFR</strong> Site-Specific Fertilizer Recommendations
            </span>
            <span className="ss-hero__stat">
              <strong>100%</strong> max yield gain
            </span>
          </div>
        </div>
      </header>

      <main className="ss-main">
        <section className="ss-stories" aria-label="Farmer testimonials">
          {SUCCESS_STORIES.map((story, index) => (
            <StoryCard key={story.id} story={story} index={index} />
          ))}
        </section>

        <section className="ss-cta" aria-labelledby="ss-cta-title">
          <div className="ss-cta__inner">
            <h2 id="ss-cta-title" className="ss-cta__title">
              Ready to see what SSFR can do on your land?
            </h2>
            <p className="ss-cta__text">
              Explore site-specific fertilizer advisories for your kebele or try a coordinate-based lookup.
            </p>
            <div className="ss-cta__actions">
              <Link className="ss-cta__btn ss-cta__btn--primary" to="/dashboard">
                Open dashboard
              </Link>
              <Link className="ss-cta__btn ss-cta__btn--ghost" to="/fertilizer_lookup">
                Site fertilizer lookup
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SuccessStories;
