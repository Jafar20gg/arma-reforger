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

console.log('All automated tests passed successfully!');
