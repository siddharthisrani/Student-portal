export const DNDC_LOCATION = {
  latitude: Number(process.env.DNDC_LATITUDE),
  longitude: Number(process.env.DNDC_LONGITUDE),
};

export const ATTENDANCE_RADIUS = Number(
  process.env.DNDC_ATTENDANCE_RADIUS || 100
);

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadius = 6371000; // metres

  const toRadians = (degree: number) =>
    degree * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

export function isInsideDNDCRadius(
  latitude: number,
  longitude: number
) {
  const distance = calculateDistance(
    latitude,
    longitude,
    DNDC_LOCATION.latitude,
    DNDC_LOCATION.longitude
  );

  return {
    allowed: distance <= ATTENDANCE_RADIUS,
    distance: Math.round(distance),
  };
}