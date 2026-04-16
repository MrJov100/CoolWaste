export function buildGoogleMapsUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return null;
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function buildGoogleMapsEmbedUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return null;
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
}

export function buildGoogleMapsDirectionsUrl({
  originLatitude,
  originLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) {
  if (
    originLatitude == null ||
    originLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null
  ) {
    return null;
  }

  const search = new URLSearchParams({
    api: "1",
    origin: `${originLatitude},${originLongitude}`,
    destination: `${destinationLatitude},${destinationLongitude}`,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${search.toString()}`;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}
