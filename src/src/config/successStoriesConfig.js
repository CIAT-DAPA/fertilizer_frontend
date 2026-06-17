/**
 * Farmer success stories for site-specific fertilizer recommendations (SSFR).
 * Photos live in public/stories/{firstName}.png
 */

export const SUCCESS_STORIES_INTRO =
  'Real results from Ethiopian farmers who adopted HaFAS site-specific fertilizer recommendations—higher yields, smarter input use, and stronger livelihoods.';

export const SUCCESS_STORIES = [
  {
    id: 'degefa',
    firstName: 'Degefa',
    name: 'Degefa Aboye',
    role: 'Farmer',
    location: 'Shurmu Kebele, Lemo District',
    crop: 'Wheat',
    highlight: '100% yield increase',
    metrics: [
      { label: 'Before SSFR', value: '8 qt / Timad' },
      { label: 'After SSFR', value: '16 qt / Timad' },
    ],
    quote:
      'Before using the Site-Specific Fertilizer Recommendation, I harvested only 8 quintals from one Timad of land. After following the recommended fertilizer application, my harvest increased to 16 quintals from the same plot—a remarkable 100% increase. This technology has transformed my farming by boosting productivity and improving my livelihood. I am proud of these results and strongly recommend it to fellow farmers.',
  },
  {
    id: 'muhidin',
    firstName: 'Muhidin',
    name: 'Muhidin Mohammed',
    role: 'Farmer',
    location: 'Meskan',
    crop: 'Maize',
    highlight: 'Better yields, less fertilizer',
    quote:
      "I've been growing maize for years, always following the advice passed down by extension services. But this season, I tried site-specific recommendations alongside my usual practices—and the difference is remarkable. My maize is taller, healthier, and the cobs are fuller. I'm seeing better yields while using less fertilizer, which means higher profits for me.",
  },
  {
    id: 'awel',
    firstName: 'Awel',
    name: 'Awel Aman',
    role: 'Farmer',
    location: 'Ethiopia',
    crop: 'Maize',
    highlight: 'More efficient fertilizer use',
    quote:
      "The SSFR recommendations were unfamiliar to me at first, but I was open to trying them. The results have been impressive—my maize is thriving, and I'm using fertilizers more efficiently. It's a more intelligent approach to farming, and the benefits are already clear.",
  },
  {
    id: 'demeke',
    firstName: 'Demeke',
    name: 'Demeke Alemu',
    role: 'Farmer',
    location: 'Ethiopia',
    crop: 'Mixed crops',
    highlight: 'Advice tailored to his land',
    quote:
      "What I like about the site-specific fertilizer recommendations (SSFR) is that they make sense for my farm. The advice I used to get from extension services was helpful, but too general. Compared to that and my usual practices, SSFR goes beyond and delivers better results. It feels like the advice is truly tailored to my land—and it's making a real difference.",
  },
];

export function farmerPhotoUrl(firstName) {
  return `${process.env.PUBLIC_URL}/stories/${firstName}.png`;
}
