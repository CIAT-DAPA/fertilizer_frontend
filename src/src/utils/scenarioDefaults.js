export const DEFAULT_SCENARIO = 'dominant';
export const FALLBACK_SCENARIO = 'normal';
export const DOMINANT_SCENARIO_OPTION = { label: 'Dominant', value: 'dominant' };

export function containsScenarioOption(array, scenario) {
    return array.some(
        (item) => item.label === scenario.label && item.value === scenario.value
    );
}
