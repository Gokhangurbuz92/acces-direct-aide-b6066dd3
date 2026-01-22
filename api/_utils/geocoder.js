// Native fetch used

/**
 * Geocode an address string using the official French "API Adresse" (BAN).
 * @param {string} address - Full address string (e.g. "1 Place de l'Étoile, Strasbourg")
 * @returns {Promise<{lat: number, lng: number, score: number} | null>}
 */
export async function geocodeAddress(address) {
    if (!address) return null;

    try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`Geocoding error: ${res.status} ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.geometry.coordinates;
            const score = feature.properties.score;

            return {
                lat,
                lng,
                score
            };
        }

        return null;
    } catch (error) {
        console.error(`Geocoding failed for "${address}":`, error.message);
        return null;
    }
}
