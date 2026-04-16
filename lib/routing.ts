import { calculateDistanceKm } from "@/lib/maps";

export type PickupRouteSnapshot = {
  distanceMeters: number;
  durationSeconds: number;
  provider: "openrouteservice" | "haversine";
  calculatedAt: Date;
};

const OPENROUTESERVICE_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/driving-car";

type ComputeRouteInput = {
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
};

export async function computePickupRouteSnapshot(
  input: ComputeRouteInput,
): Promise<PickupRouteSnapshot | null> {
  const {
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
  } = input;

  if (
    originLatitude == null ||
    originLongitude == null ||
    destinationLatitude == null ||
    destinationLongitude == null
  ) {
    return null;
  }

  const apiKey = process.env.OPENROUTESERVICE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(OPENROUTESERVICE_DIRECTIONS_URL, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [originLongitude, originLatitude],
            [destinationLongitude, destinationLatitude],
          ],
        }),
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as {
          routes?: Array<{
            summary?: {
              distance?: number;
              duration?: number;
            };
          }>;
        };

        const summary = payload.routes?.[0]?.summary;
        if (summary?.distance != null && summary.duration != null) {
          return {
            distanceMeters: Math.round(summary.distance),
            durationSeconds: Math.round(summary.duration),
            provider: "openrouteservice",
            calculatedAt: new Date(),
          };
        }
      } else {
        console.error("openrouteservice route lookup failed", await response.text());
      }
    } catch (error) {
      console.error("openrouteservice route lookup error", error);
    }
  }

  const directDistanceKm = calculateDistanceKm(
    originLatitude,
    originLongitude,
    destinationLatitude,
    destinationLongitude,
  );

  if (directDistanceKm == null) {
    return null;
  }

  const fallbackDistanceMeters = Math.round(directDistanceKm * 1000);
  const averageUrbanDrivingSpeedKmh = 30;
  const fallbackDurationSeconds = Math.max(
    60,
    Math.round((directDistanceKm / averageUrbanDrivingSpeedKmh) * 3600),
  );

  return {
    distanceMeters: fallbackDistanceMeters,
    durationSeconds: fallbackDurationSeconds,
    provider: "haversine",
    calculatedAt: new Date(),
  };
}

export function formatDistanceMeters(distanceMeters?: number | null) {
  if (distanceMeters == null) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatDurationSeconds(durationSeconds?: number | null) {
  if (durationSeconds == null) {
    return null;
  }

  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${totalMinutes} menit`;
  }

  if (minutes === 0) {
    return `${hours} jam`;
  }

  return `${hours} jam ${minutes} menit`;
}
