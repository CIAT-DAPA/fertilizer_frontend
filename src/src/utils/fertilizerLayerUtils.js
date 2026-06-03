/**
 * Parse GeoServer fertilizer layer names (et_{crop}_{product}_probabilistic_{scenario}).
 */

const EXCLUDED_NUTRIENTS = new Set(['n', 'p']);

const PRODUCT_SORT_ORDER = ['dap', 'urea', 'nps', 'compost', 'vcompost', 'yield'];

const PRODUCT_LABELS = {
    dap: 'DAP',
    urea: 'Urea',
    nps: 'NPS',
    compost: 'Compost',
    vcompost: 'Vermi-compost',
    yield: 'Expected yield',
};

export function parseLayerName(layerName) {
    const parts = layerName.split('_');
    if (parts.length < 4) return null;

    const crop = parts[1];
    let fertilizer = parts[2];

    if (fertilizer === 'optimal' && parts[3] === 'nutrients') {
        if (parts[4] === 'n') fertilizer = 'n';
        else if (parts[4] === 'p') fertilizer = 'p';
        else fertilizer = parts.slice(2, 5).join('_');
    } else if (fertilizer === 'yieldtypes' && parts[3] === 'optimal') {
        fertilizer = 'yieldtypes_optimal';
    }

    const scenario = parts[parts.length - 1];
    return { crop, fertilizer, scenario };
}

export function isExcludedNutrientLayer(fertilizer) {
    const key = fertilizer.toLowerCase();
    return EXCLUDED_NUTRIENTS.has(key) || key.includes('optimal_nutrients');
}

export function getProductKey(fertilizer) {
    const lower = fertilizer.toLowerCase();
    if (lower === 'yieldtypes_optimal' || lower === 'yieldtypes') return 'yield';
    if (lower === 'dap') return 'dap';
    if (lower === 'urea') return 'urea';
    if (lower === 'nps') return 'nps';
    if (lower === 'compost') return 'compost';
    if (lower === 'vcompost') return 'vcompost';
    return null;
}

export function getProductLabel(productKey) {
    return PRODUCT_LABELS[productKey] || productKey;
}

export function getProductUnit(productKey) {
    if (productKey === 'compost' || productKey === 'vcompost') return 'ton/ha';
    if (productKey === 'yield') return 'kg/ha';
    return 'kg/ha';
}

/**
 * Dominant advisory layers for a crop, excluding N and P nutrient layers.
 * Deduplicates DAP/dap style duplicates by product key.
 */
export function getDominantAdvisoryLayers(allLayerNames, crop) {
    if (!crop || !allLayerNames?.length) return [];

    const cropLower = crop.toLowerCase();
    const byProduct = new Map();

    allLayerNames.forEach((layerName) => {
        if (!layerName.endsWith('_dominant')) return;

        const parsed = parseLayerName(layerName);
        if (!parsed || parsed.scenario !== 'dominant') return;
        if (parsed.crop.toLowerCase() !== cropLower) return;
        if (isExcludedNutrientLayer(parsed.fertilizer)) return;

        const productKey = getProductKey(parsed.fertilizer);
        if (!productKey || byProduct.has(productKey)) return;

        byProduct.set(productKey, {
            layer: layerName,
            productKey,
            label: getProductLabel(productKey),
            unit: getProductUnit(productKey),
        });
    });

    return PRODUCT_SORT_ORDER.filter((key) => byProduct.has(key)).map((key) => byProduct.get(key));
}

export function getCropsFromDominantLayers(allLayerNames) {
    const crops = new Set();
    allLayerNames.forEach((layerName) => {
        if (!layerName.endsWith('_dominant')) return;
        const parsed = parseLayerName(layerName);
        if (!parsed || parsed.scenario !== 'dominant') return;
        if (isExcludedNutrientLayer(parsed.fertilizer)) return;
        if (!getProductKey(parsed.fertilizer)) return;
        crops.add(parsed.crop);
    });
    return Array.from(crops).sort((a, b) => a.localeCompare(b));
}

export function formatCropName(crop) {
    if (!crop) return '';
    return crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
}

export function forecastDateFromYear(year) {
    return `${year}-07`;
}

export function buildYearOptions(startYear = 2020) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= startYear; y -= 1) {
        years.push(y);
    }
    return years;
}

export const ETHIOPIA_BOUNDS = {
    latMin: 3.4,
    latMax: 14.9,
    lonMin: 33.0,
    lonMax: 48.0,
};

export function isWithinEthiopia(lat, lon) {
    return (
        lat >= ETHIOPIA_BOUNDS.latMin &&
        lat <= ETHIOPIA_BOUNDS.latMax &&
        lon >= ETHIOPIA_BOUNDS.lonMin &&
        lon <= ETHIOPIA_BOUNDS.lonMax
    );
}
