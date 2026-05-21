/**
 * Partner logos served from /public/logos/.
 * Keep in sync with fertilizer_frontend/src/public/logos/ (exclude duplicate .webp when .png exists;
 * logo_nextgen.png is platform branding, not listed as a partner).
 */
export const PARTNERS_INTRO =
  'HaFAS is developed through collaboration among national institutions, CGIAR centers, and development partners working together to scale climate-smart, data-driven agronomic advisories across Ethiopia.';

export const ETHIOPIA_PARTNERS = [
  {
    id: 'alliance',
    name: 'Alliance of Bioversity International and CIAT',
    logo: 'alliance-logo.png',
    url: 'https://alliancebioversityciat.org/',
  },
  {
    id: 'eiar',
    name: 'Ethiopian Institute of Agricultural Research (EIAR)',
    logo: 'eiar-logo.png',
    url: 'https://www.eiar.gov.et/',
  },
  {
    id: 'moa',
    name: 'Ministry of Agriculture',
    logo: 'moa-logo.png',
    url: 'https://www.moa.gov.et/',
  },
  {
    id: 'aiccra',
    name: 'AICCRA',
    logo: 'aiccra-logo.png',
    url: 'https://aiccra.cgiar.org/',
  },
  {
    id: 'eia',
    name: 'Excellence in Agronomy (EiA)',
    logo: 'eia-logo.png',
    url: 'https://www.cgiar.org/initiative/excellence-in-agronomy/',
  },
  {
    id: 'giz',
    name: 'GIZ Ethiopia',
    logo: 'giz-logo.jpg',
    url: 'https://www.giz.de/en/worldwide/336.html',
  },
  {
    id: 'ati',
    name: 'Agricultural Transformation Institute',
    logo: 'ati-logo.png',
    url: 'https://www.ata.gov.et/',
  },
  {
    id: 'cow',
    name: 'Ethio AgriData (COW)',
    logo: 'cow-logo.png',
    url: 'https://ethioagridata.com/',
  },
  {
    id: 'cimmyt',
    name: 'CIMMYT',
    logo: 'cimmyt-logo.png',
    url: 'https://www.cimmyt.org/',
  },
  {
    id: 'icrisat',
    name: 'ICRISAT',
    logo: 'icrisat-logo.png',
    url: 'https://www.icrisat.org/',
  },
  {
    id: 'cgiar-sf',
    name: 'CGIAR',
    logo: 'cgiar-sf-logo.png',
    url: 'https://www.cgiar.org/',
  },
];

export function partnerLogoSrc(filename) {
  return `/logos/${filename}`;
}
