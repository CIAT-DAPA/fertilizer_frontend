import { useEffect, useState } from 'react';
import GeoFeatures from '../services/GeoFeatures';

/** Deepest admin unit with a GeoServer ext_id — used to load boundary GeoJSON. */
export function getLocationGeoTarget(report) {
  if (!report) return null;
  if (report.kebele?.[2]) {
    return { level: 'kebele', fetch: () => GeoFeatures.geojsonKebele(report.kebele[2]) };
  }
  if (report.woreda?.[2]) {
    return { level: 'woreda', fetch: () => GeoFeatures.geojsonWoreda(report.woreda[2]) };
  }
  if (report.zone?.[2]) {
    return { level: 'zone', fetch: () => GeoFeatures.geojsonZone(report.zone[2]) };
  }
  if (report.region?.[2]) {
    return { level: 'region', fetch: () => GeoFeatures.geojsonRegion(report.region[2]) };
  }
  return null;
}

export function useDashboardLocationGeo(report) {
  const [geoJson, setGeoJson] = useState(null);
  const [status, setStatus] = useState('idle');
  const [level, setLevel] = useState(null);

  useEffect(() => {
    const target = getLocationGeoTarget(report);
    if (!target) {
      setGeoJson(null);
      setLevel(null);
      setStatus(report?.country ? 'idle' : 'idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    setLevel(target.level);

    target
      .fetch()
      .then((data) => {
        if (cancelled) return;
        if (data?.features?.length) {
          setGeoJson(data);
          setStatus('ready');
        } else {
          setGeoJson(null);
          setStatus('empty');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGeoJson(null);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [
    report?.country,
    report?.type,
    report?.region?.[2],
    report?.zone?.[2],
    report?.woreda?.[2],
    report?.kebele?.[2],
  ]);

  return { geoJson, status, level };
}
