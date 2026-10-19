import { MAPS, getMapWithOverrides } from '../data/mapsData';
import {
  worldToLatLng,
  latLngToWorld,
  calculateEuclideanDistance,
  calculateSlantDistance,
  calculateAzimuth,
  formatGrid,
  parseGrid,
  calculateScaleBarMetrics,
  formatDistance,
} from '../utils/coordinates';
import { computeFireSolution } from '../utils/ballistics';
import { WorldPoint } from '../types/mortar';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertClose(actual: number, expected: number, tolerance = 0.05, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`TEST FAILED: ${message}. Expected ~${expected}, got ${actual} (diff: ${diff} > ${tolerance})`);
  }
}

console.log('Running test suite for Arma Reforger Fire Control System...');

const everon = MAPS.everon;
const montignac: WorldPoint = { xMeters: 5124, yMeters: 6981 };
const montignacLatLng = worldToLatLng(montignac, everon);

assertClose(montignacLatLng.lng, 5174, 0.001, 'Montignac longitude calculation');
assertClose(montignacLatLng.lat, 7031, 0.001, 'Montignac latitude calculation');

const roundTripMontignac = latLngToWorld(montignacLatLng, everon);
assert(roundTripMontignac.xMeters === 5124, `Montignac X inverse mismatch: ${roundTripMontignac.xMeters}`);
assert(roundTripMontignac.yMeters === 6981, `Montignac Y inverse mismatch: ${roundTripMontignac.yMeters}`);

const mortarPos: WorldPoint = { xMeters: 4250, yMeters: 7500, altitudeMeters: 50 };
const targetPos: WorldPoint = { xMeters: 5450, yMeters: 8400, altitudeMeters: 65 };

const dist = calculateEuclideanDistance(mortarPos, targetPos);
assert(dist === 1500, `Distance expected 1500, got ${dist}`);

const azNato = calculateAzimuth(mortarPos, targetPos, 'm252');
assertClose(azNato.degrees, 53.1, 0.1, 'Azimuth degrees');
assertClose(azNato.mils, 945, 1, 'NATO 6400 Azimuth mils');

const azWarsaw = calculateAzimuth(mortarPos, targetPos, 'b2b14');
assertClose(azWarsaw.mils, 886, 1, 'Warsaw Pact 6000 Azimuth mils');

const m252Sol = computeFireSolution({
  mortar: mortarPos,
  target: targetPos,
  weaponType: 'm252',
  projectileId: 'm821-he',
});
assert(m252Sol.inRange, 'M252 solution should be in range at 1500m');
assert(m252Sol.status === 'valid', 'M252 solution should be valid');

// Test NATO vs Warsaw Pact angular circle conversion
import { milsToDegrees, degreesToMils, isElevationWithinLimits } from '../utils/ballistics';
// NATO 6400: 800 mil = 800 * 360 / 6400 = 45.0 degrees
assertClose(milsToDegrees(800, 'm252'), 45.0, 0.1, 'M252 min elevation degrees');
assertClose(milsToDegrees(1515, 'm252'), 85.2, 0.1, 'M252 max elevation degrees');

// Warsaw Pact 6000: 748 mil = 748 * 360 / 6000 = 44.88 -> ~44.9 degrees
assertClose(milsToDegrees(748, 'b2b14'), 44.9, 0.1, '2B14 min elevation degrees');
assertClose(milsToDegrees(1415, 'b2b14'), 84.9, 0.1, '2B14 max elevation degrees');

// Verify limit enforcement
assert(isElevationWithinLimits(800, 'm252'), '800 mil should be valid for M252');
assert(isElevationWithinLimits(1515, 'm252'), '1515 mil should be valid for M252');
assert(!isElevationWithinLimits(799, 'm252'), '799 mil should be below min for M252');
assert(!isElevationWithinLimits(1516, 'm252'), '1516 mil should be above max for M252');

assert(isElevationWithinLimits(748, 'b2b14'), '748 mil should be valid for 2B14');
assert(isElevationWithinLimits(1415, 'b2b14'), '1415 mil should be valid for 2B14');
assert(!isElevationWithinLimits(747, 'b2b14'), '747 mil should be below min for 2B14');
assert(!isElevationWithinLimits(1416, 'b2b14'), '1416 mil should be above max for 2B14');

// Test too-close condition (e.g. 30m away)
const closeTarget: WorldPoint = { xMeters: 4260, yMeters: 7520, altitudeMeters: 50 };
const closeSol = computeFireSolution({
  mortar: mortarPos,
  target: closeTarget,
  weaponType: 'm252',
  projectileId: 'm821-he',
});
assert(!closeSol.inRange, 'Close target should not be in range');
assert(closeSol.status === 'too-close', `Status should be too-close, got ${closeSol.status}`);

// Test too-far condition (e.g. 10,000m away)
const farTarget: WorldPoint = { xMeters: 14250, yMeters: 7500, altitudeMeters: 50 };
const farSol = computeFireSolution({
  mortar: mortarPos,
  target: farTarget,
  weaponType: 'm252',
  projectileId: 'm821-he',
});
assert(!farSol.inRange, 'Far target should not be in range');
assert(farSol.status === 'too-far', `Status should be too-far, got ${farSol.status}`);

console.log('All automated tests passed successfully!');
