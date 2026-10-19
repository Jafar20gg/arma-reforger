import { BALLISTIC_DATA, BallisticRow, ChargeConfig, ShellType } from '../data/ballisticData';
import { FireSolution, WeaponType, WorldPoint } from '../types/mortar';
import { calculateAzimuth, calculateEuclideanDistance } from './coordinates';

export interface ComputeSolutionOptions {
  mortar: WorldPoint;
  target: WorldPoint;
  weaponType: WeaponType;
  projectileId?: string;
  preferredCharge?: number;
}

function interpolateRow(r1: BallisticRow, r2: BallisticRow, targetRange: number): BallisticRow {
  if (r1.range === r2.range) return r1;
  const factor = (targetRange - r1.range) / (r2.range - r1.range);
  const dElev1 = r1.dElev ?? 0;
  const dElev2 = r2.dElev ?? 0;
  return {
    range: targetRange,
    elevation: Math.round(r1.elevation + factor * (r2.elevation - r1.elevation)),
    tof: Number((r1.tof + factor * (r2.tof - r1.tof)).toFixed(1)),
    dElev: Number((dElev1 + factor * (dElev2 - dElev1)).toFixed(1)),
    maxOrdinate: r1.maxOrdinate && r2.maxOrdinate
      ? Math.round(r1.maxOrdinate + factor * (r2.maxOrdinate - r1.maxOrdinate))
      : undefined,
    angleOfFall: r1.angleOfFall && r2.angleOfFall
      ? Number((r1.angleOfFall + factor * (r2.angleOfFall - r1.angleOfFall)).toFixed(1))
      : undefined,
  };
}

function findRowForRange(charge: ChargeConfig, range: number): BallisticRow | null {
  if (range < charge.minRange || range > charge.maxRange) {
    return null;
  }
  const rows = charge.rows;
  if (!rows || rows.length === 0) return null;

  const exact = rows.find(r => r.range === range);
  if (exact) return exact;

  for (let i = 0; i < rows.length - 1; i++) {
    const cur = rows[i];
    const nxt = rows[i + 1];
    if (range >= cur.range && range <= nxt.range) {
      return interpolateRow(cur, nxt, range);
    }
  }
  return null;
}

export function computeFireSolution(options: ComputeSolutionOptions): FireSolution {
  const { mortar, target, weaponType, projectileId, preferredCharge } = options;
  const weapon = BALLISTIC_DATA[weaponType === 'b2b14' ? 'b2b14' : 'm252'];
  const rounds = weapon.defaultRounds;
  const shell: ShellType = rounds.find((r: ShellType) => r.id === projectileId) || rounds[0];
  const distance = calculateEuclideanDistance(mortar, target);
  const deltaAltitude = (target.altitudeMeters ?? 0) - (mortar.altitudeMeters ?? 0);
  const azimuth = calculateAzimuth(mortar, target, weaponType);

  const chargeSolutions = shell.charges.map(charge => {
    const row = findRowForRange(charge, distance);
    if (!row) {
      return {
        rings: charge.rings,
        elevationMils: 0,
        elevationDegrees: 0,
        timeOfFlightSec: 0,
        inRange: false,
        row: null,
      };
    }

    const heightCorrectionMils = (row.dElev ?? 0) * (deltaAltitude / 100);
    const correctedElev = Math.round(row.elevation - heightCorrectionMils);
    const elevDeg = Number(((correctedElev * 360) / weapon.milsPerCircle).toFixed(1));

    return {
      rings: charge.rings,
      elevationMils: correctedElev,
      elevationDegrees: elevDeg,
      timeOfFlightSec: row.tof,
      inRange: true,
      row,
    };
  });

  const validCharges = chargeSolutions.filter(c => c.inRange);

  let chosen = validCharges.find(c => c.rings === preferredCharge);
  if (!chosen) {
    chosen = validCharges[0];
  }

  const globalMin = Math.min(...shell.charges.map(c => c.minRange));
  const globalMax = Math.max(...shell.charges.map(c => c.maxRange));

  if (!chosen || !chosen.row) {
    let status: 'too-close' | 'too-far' | 'no-solution' = 'no-solution';
    let warning = `Target is out of range (${globalMin}m - ${globalMax}m)`;
    let warningAr = `الهدف خارج المدى (${globalMin}م - ${globalMax}م)`;

    if (distance < globalMin) {
      status = 'too-close';
      warning = `Target is too close (${Math.round(distance)}m < minimum ${globalMin}m)`;
      warningAr = `الهدف قريب جداً (${Math.round(distance)}م < أدنى مدى ${globalMin}م)`;
    } else if (distance > globalMax) {
      status = 'too-far';
      warning = `Target exceeds maximum range (${Math.round(distance)}m > maximum ${globalMax}m)`;
      warningAr = `الهدف يتجاوز أقصى مدى (${Math.round(distance)}م > أقصى مدى ${globalMax}م)`;
    }

    return {
      weaponId: weaponType,
      projectileId: shell.id,
      horizontalDistanceMeters: Math.round(distance),
      deltaAltitudeMeters: Math.round(deltaAltitude),
      azimuthDegrees: azimuth.degrees,
      azimuthMils: azimuth.mils,
      chargeRings: preferredCharge ?? 0,
      elevationMils: 0,
      elevationDegrees: 0,
      timeOfFlightSec: 0,
      inRange: false,
      status,
      warningMessage: warning,
      warningMessageAr: warningAr,
      availableCharges: chargeSolutions.map(c => ({
        rings: c.rings,
        elevationMils: c.elevationMils,
        elevationDegrees: c.elevationDegrees,
        timeOfFlightSec: c.timeOfFlightSec,
        inRange: c.inRange,
      })),
    };
  }

  const chosenElevDeg = Number(((chosen.elevationMils * 360) / weapon.milsPerCircle).toFixed(1));

  return {
    weaponId: weaponType,
    projectileId: shell.id,
    horizontalDistanceMeters: Math.round(distance),
    deltaAltitudeMeters: Math.round(deltaAltitude),
    azimuthDegrees: azimuth.degrees,
    azimuthMils: azimuth.mils,
    chargeRings: chosen.rings,
    elevationMils: chosen.elevationMils,
    elevationDegrees: chosenElevDeg,
    timeOfFlightSec: chosen.timeOfFlightSec,
    maxOrdinateMeters: chosen.row.maxOrdinate,
    angleOfFallDeg: chosen.row.angleOfFall,
    inRange: true,
    status: 'valid',
    availableCharges: chargeSolutions.map(c => ({
      rings: c.rings,
      elevationMils: c.elevationMils,
      elevationDegrees: c.elevationDegrees,
      timeOfFlightSec: c.timeOfFlightSec,
      inRange: c.inRange,
    })),
  };
}
