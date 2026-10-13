import {
  BallisticEntry,
  FireAdjustment,
  FireMissionSolution,
  MortarChargeData,
  MortarDefinition,
  MortarState,
  POI,
  Target,
} from '../types';
import {
  calculateAzimuthRadians,
  calculateRange,
  degreesToMils,
  normalizeRadians,
  radiansToDegrees,
  to6DigitGrid,
} from './coordinates';

/**
 * Linearly interpolate ballistic entry values between two ranges
 */
export function interpolateBallistics(
  targetRange: number,
  lower: BallisticEntry,
  upper: BallisticEntry
): { elevation_mil: number; delev_per_100m: number; time_of_flight_s?: number } {
  if (lower.range_m === upper.range_m) {
    return {
      elevation_mil: lower.elevation_mil,
      delev_per_100m: lower.delev_per_100m,
      time_of_flight_s: lower.time_of_flight_s,
    };
  }

  const factor = (targetRange - lower.range_m) / (upper.range_m - lower.range_m);
  const elevation_mil = lower.elevation_mil + factor * (upper.elevation_mil - lower.elevation_mil);
  const delev_per_100m = lower.delev_per_100m + factor * (upper.delev_per_100m - lower.delev_per_100m);

  let time_of_flight_s: number | undefined = undefined;
  if (lower.time_of_flight_s !== undefined && upper.time_of_flight_s !== undefined) {
    time_of_flight_s =
      lower.time_of_flight_s + factor * (upper.time_of_flight_s - lower.time_of_flight_s);
  }

  return { elevation_mil, delev_per_100m, time_of_flight_s };
}

/**
 * Compute the complete fire mission solution from a Mortar to a Target
 */
export function computeFireSolution(
  mortar: MortarState,
  target: Target,
  mortarDef: MortarDefinition
): FireMissionSolution {
  const dx = target.x - mortar.x;
  const dy = target.y - mortar.y;
  const range_m = calculateRange(mortar.x, mortar.y, target.x, target.y);

  // Azimuth
  const azRad = calculateAzimuthRadians(mortar.x, mortar.y, target.x, target.y);
  const azimuth_deg = radiansToDegrees(azRad);
  const azimuth_mil = degreesToMils(azimuth_deg, mortar.milSystem);

  const availableChargesList = Object.keys(mortarDef.charges)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate global min and max range across all charges
  let globalMin = Infinity;
  let globalMax = -Infinity;
  for (const cNum of availableChargesList) {
    const cData = mortarDef.charges[cNum.toString()];
    if (cData) {
      if (cData.min_range_m < globalMin) globalMin = cData.min_range_m;
      if (cData.max_range_m > globalMax) globalMax = cData.max_range_m;
    }
  }

  const warnings: FireMissionSolution['warnings'] = [];
  if (range_m < globalMin) {
    warnings.push('TOO_CLOSE');
  } else if (range_m > globalMax) {
    warnings.push('OUT_OF_RANGE');
  }

  // Determine charge: override or lowest charge that covers the range
  let chosenCharge: number = availableChargesList[0] ?? 0;
  if (
    mortar.selectedChargeOverride !== null &&
    mortarDef.charges[mortar.selectedChargeOverride.toString()]
  ) {
    chosenCharge = mortar.selectedChargeOverride;
  } else {
    // Choose lowest charge that reaches the range
    let found = false;
    for (const cNum of availableChargesList) {
      const cData = mortarDef.charges[cNum.toString()];
      if (range_m >= cData.min_range_m && range_m <= cData.max_range_m) {
        chosenCharge = cNum;
        found = true;
        break;
      }
    }
    if (!found) {
      if (range_m < globalMin) {
        chosenCharge = availableChargesList[0];
      } else {
        chosenCharge = availableChargesList[availableChargesList.length - 1];
      }
    }
  }

  const chargeData: MortarChargeData | undefined = mortarDef.charges[chosenCharge.toString()];
  if (!chargeData || !chargeData.entries || chargeData.entries.length === 0) {
    return {
      targetId: target.id,
      range_m: Math.round(range_m),
      dx: Math.round(dx),
      dy: Math.round(dy),
      azimuth_deg: Number(azimuth_deg.toFixed(1)),
      azimuth_mil,
      charge: chosenCharge,
      availableCharges: availableChargesList,
      elevation_mil: 0,
      baseElevation_mil: 0,
      altitudeDelta_m: Math.round(target.altitude - mortar.altitude),
      altitudeCorrection_mil: 0,
      warnings: ['NO_CHARGE_DATA'],
      minRange_m: globalMin === Infinity ? 0 : globalMin,
      maxRange_m: globalMax === -Infinity ? 5000 : globalMax,
    };
  }

  const entries = [...chargeData.entries].sort((a, b) => a.range_m - b.range_m);
  let baseElev = 0;
  let dElev = 0;
  let tof: number | undefined = undefined;

  if (range_m <= entries[0].range_m) {
    baseElev = entries[0].elevation_mil;
    dElev = entries[0].delev_per_100m;
    tof = entries[0].time_of_flight_s;
    if (range_m < chargeData.min_range_m && !warnings.includes('TOO_CLOSE')) {
      warnings.push('TOO_CLOSE');
    }
  } else if (range_m >= entries[entries.length - 1].range_m) {
    const last = entries[entries.length - 1];
    baseElev = last.elevation_mil;
    dElev = last.delev_per_100m;
    tof = last.time_of_flight_s;
    if (range_m > chargeData.max_range_m && !warnings.includes('OUT_OF_RANGE')) {
      warnings.push('OUT_OF_RANGE');
    }
  } else {
    // Interpolate between the adjacent entries
    for (let i = 0; i < entries.length - 1; i++) {
      if (range_m >= entries[i].range_m && range_m <= entries[i + 1].range_m) {
        const interp = interpolateBallistics(range_m, entries[i], entries[i + 1]);
        baseElev = interp.elevation_mil;
        dElev = interp.delev_per_100m;
        tof = interp.time_of_flight_s;
        break;
      }
    }
  }

  // Altitude Correction:
  // Height difference = Target Altitude - Mortar Altitude (meters)
  // Correction = (Height Diff / 100) * dElev
  const altitudeDelta_m = target.altitude - mortar.altitude;
  if (Math.abs(altitudeDelta_m) > 400 && !warnings.includes('EXTREME_ALTITUDE')) {
    warnings.push('EXTREME_ALTITUDE');
  }

  const altitudeCorrection_mil = (altitudeDelta_m / 100) * dElev;
  const totalElevation_mil = Math.round(baseElev + altitudeCorrection_mil);

  return {
    targetId: target.id,
    range_m: Math.round(range_m),
    dx: Math.round(dx),
    dy: Math.round(dy),
    azimuth_deg: Number(azimuth_deg.toFixed(1)),
    azimuth_mil,
    charge: chosenCharge,
    availableCharges: availableChargesList,
    elevation_mil: Math.max(0, totalElevation_mil),
    baseElevation_mil: Math.round(baseElev),
    altitudeDelta_m: Math.round(altitudeDelta_m),
    altitudeCorrection_mil: Number(altitudeCorrection_mil.toFixed(1)),
    timeOfFlight_s: tof !== undefined ? Number(tof.toFixed(1)) : undefined,
    warnings,
    minRange_m: chargeData.min_range_m,
    maxRange_m: chargeData.max_range_m,
  };
}

/**
 * Fire Adjustment Tool:
 * Adjust target location based on observed miss relative to observer-target line.
 */
export function calculateFireAdjustment(
  target: Target,
  mortar: MortarState,
  adjustment: FireAdjustment
): {
  newTargetCoords: { x: number; y: number };
  deltaRange_m: number;
} {
  let obsBearingDeg = adjustment.observerAzimuth_deg;
  if (obsBearingDeg === undefined || isNaN(obsBearingDeg)) {
    const azRad = calculateAzimuthRadians(mortar.x, mortar.y, target.x, target.y);
    obsBearingDeg = radiansToDegrees(azRad);
  }

  const obsBearingRad = normalizeRadians((obsBearingDeg * Math.PI) / 180);

  const dirX = Math.sin(obsBearingRad);
  const dirY = Math.cos(obsBearingRad);

  const rightX = dirY;
  const rightY = -dirX;

  const distCorr = adjustment.distanceCorrection_m;
  const latCorr = adjustment.lateralCorrection_m;

  const newX = target.x + distCorr * dirX + latCorr * rightX;
  const newY = target.y + distCorr * dirY + latCorr * rightY;

  const oldRange = calculateRange(mortar.x, mortar.y, target.x, target.y);
  const newRange = calculateRange(mortar.x, mortar.y, newX, newY);

  return {
    newTargetCoords: {
      x: Math.round(newX),
      y: Math.round(newY),
    },
    deltaRange_m: Math.round(newRange - oldRange),
  };
}

/**
 * Auto-name target with nearest POI or Location Layer item if within maxDistanceMeters, otherwise use grid reference
 */
export function getAutoTargetName(
  x: number,
  y: number,
  terrainPois: POI[],
  visibleLayers: import('../types').LocationLayer[] = [],
  language: 'ar' | 'en' = 'ar',
  maxDistanceMeters = 500
): string {
  let nearestName: string | null = null;
  let minDistance = Infinity;

  // 1. Check POIs
  for (const poi of terrainPois) {
    const dist = calculateRange(x, y, poi.x, poi.y);
    if (dist < minDistance) {
      minDistance = dist;
      nearestName = (language === 'ar' && poi.nameAr) ? poi.nameAr : poi.name;
    }
  }

  // 2. Check visible Location Layers (e.g. supplies, vehicles, refuel, MOB)
  for (const layer of visibleLayers) {
    if (!layer.isVisible) continue;
    for (const item of layer.items) {
      const dist = calculateRange(x, y, item.x, item.y);
      if (dist < minDistance) {
        minDistance = dist;
        nearestName = `[${layer.name}] ${item.name}`;
      }
    }
  }

  const gridRef = to6DigitGrid(x, y);

  if (nearestName && minDistance <= maxDistanceMeters) {
    const prefix = language === 'ar' ? 'قرب ' : 'Near ';
    return `${prefix}${nearestName} [${gridRef}]`;
  }

  return `GRID ${gridRef}`;
}

export interface AccuracyTestResult {
  mortarId: string;
  charge: number;
  inputRange_m: number;
  inputHeightDelta_m: number;
  inGameElevation_mil: number;
  calculatedElevation_mil: number;
  elevationDiff_mil: number;
  percentageDiff: number;
  isWithinTolerance: boolean; // within 2 mils
}

/**
 * Accuracy test verification helper:
 * Compares known in-game trial with the engine's calculation
 */
export function testFiringAccuracy(
  mortarDef: MortarDefinition,
  charge: number,
  range_m: number,
  heightDelta_m: number,
  inGameElevation_mil: number
): AccuracyTestResult | null {
  const chargeData = mortarDef.charges[charge.toString()];
  if (!chargeData || !chargeData.entries.length) return null;

  const entries = [...chargeData.entries].sort((a, b) => a.range_m - b.range_m);
  let baseElev = 0;
  let dElev = 0;

  if (range_m <= entries[0].range_m) {
    baseElev = entries[0].elevation_mil;
    dElev = entries[0].delev_per_100m;
  } else if (range_m >= entries[entries.length - 1].range_m) {
    const last = entries[entries.length - 1];
    baseElev = last.elevation_mil;
    dElev = last.delev_per_100m;
  } else {
    for (let i = 0; i < entries.length - 1; i++) {
      if (range_m >= entries[i].range_m && range_m <= entries[i + 1].range_m) {
        const interp = interpolateBallistics(range_m, entries[i], entries[i + 1]);
        baseElev = interp.elevation_mil;
        dElev = interp.delev_per_100m;
        break;
      }
    }
  }

  const altCorr = (heightDelta_m / 100) * dElev;
  const calculatedElevation_mil = Math.round(baseElev + altCorr);
  const elevationDiff_mil = calculatedElevation_mil - inGameElevation_mil;
  const percentageDiff = Number(
    (Math.abs(elevationDiff_mil) / (inGameElevation_mil || 1) * 100).toFixed(2)
  );

  return {
    mortarId: mortarDef.id,
    charge,
    inputRange_m: range_m,
    inputHeightDelta_m: heightDelta_m,
    inGameElevation_mil,
    calculatedElevation_mil,
    elevationDiff_mil,
    percentageDiff,
    isWithinTolerance: Math.abs(elevationDiff_mil) <= 2,
  };
}
