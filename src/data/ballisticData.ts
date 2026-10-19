/**
 * Authentic Arma Reforger 1.7+ Ballistic Tables
 * Source: In-Game Ballistic Table Gadget & Official Transcriptions
 */

import { WeaponType } from '../types/mortar';

export interface BallisticRow {
  range: number;        // Target distance in meters
  elevation: number;    // Mortar tube elevation in mils
  tof: number;          // Time of flight in seconds
  dElev?: number;       // Elevation correction per 100m height diff
  tofPer100m?: number;
  maxOrdinate?: number; // Maximum apex height in meters
  angleOfFall?: number; // Impact angle in degrees
  windDrift?: number;
  windRange?: number;
}

export interface ChargeConfig {
  chargeId: string;
  name: string;
  rings: number;
  minRange: number;
  maxRange: number;
  rows: BallisticRow[];
}

export interface ShellType {
  id: string;
  name: string;
  category: string;
  charges: ChargeConfig[];
}

export interface WeaponData {
  id: WeaponType;
  name: string;
  nameAr: string;
  calibre: string;
  milsPerCircle: number;
  minElevationMils: number;
  maxElevationMils: number;
  minElevationDeg: number;
  maxElevationDeg: number;
  standard: 'NATO' | 'Warsaw Pact';
  defaultRounds: ShellType[];
}

export const BALLISTIC_DATA: Record<'m252' | 'b2b14', WeaponData> = {
  m252: {
    id: 'm252',
    name: 'M252 81mm Mortar',
    nameAr: 'هاون M252 عيار 81 ملم',
    calibre: '81mm',
    milsPerCircle: 6400,
    minElevationMils: 800,
    maxElevationMils: 1515,
    minElevationDeg: 45.0,
    maxElevationDeg: 85.2,
    standard: 'NATO',
    defaultRounds: [
      {
        id: 'm821-he',
        name: 'M821 HE',
        category: 'he',
        charges: [
          {
            chargeId: 'm821-he-0',
            name: 'Charge 0',
            rings: 0,
            minRange: 100,
            maxRange: 400,
            rows: [
              { range: 100, elevation: 1479, tof: 13.2, dElev: 62, tofPer100m: 0.1, maxOrdinate: 214, angleOfFall: 84.2, windDrift: 41, windRange: 4 },
              { range: 150, elevation: 1417, tof: 13.1, dElev: 67, tofPer100m: 0.2, maxOrdinate: 210, angleOfFall: 79.9, windDrift: 24, windRange: 4 },
              { range: 200, elevation: 1350, tof: 12.9, dElev: 70, tofPer100m: 0.3, maxOrdinate: 204, angleOfFall: 76.3, windDrift: 18, windRange: 4 },
              { range: 250, elevation: 1280, tof: 12.6, dElev: 78, tofPer100m: 0.3, maxOrdinate: 196, angleOfFall: 73.5, windDrift: 15, windRange: 5 },
              { range: 300, elevation: 1202, tof: 12.3, dElev: 94, tofPer100m: 0.5, maxOrdinate: 185, angleOfFall: 68.2, windDrift: 12, windRange: 5 },
              { range: 350, elevation: 1108, tof: 11.8, dElev: 145, tofPer100m: 1, maxOrdinate: 170, angleOfFall: 63.1, windDrift: 10, windRange: 5 },
              { range: 400, elevation: 963, tof: 10.8, maxOrdinate: 143, angleOfFall: 56.1, windRange: 6 }
            ]
          },
          {
            chargeId: 'm821-he-1',
            name: 'Charge 1',
            rings: 1,
            minRange: 100,
            maxRange: 900,
            rows: [
              { range: 100, elevation: 1547, tof: 20.0, dElev: 27, maxOrdinate: 491, angleOfFall: 87.2, windDrift: 117, windRange: 11 },
              { range: 200, elevation: 1493, tof: 19.9, dElev: 28, tofPer100m: 0.1, maxOrdinate: 487, angleOfFall: 85.2, windDrift: 66, windRange: 12 },
              { range: 300, elevation: 1437, tof: 19.8, dElev: 28, tofPer100m: 0.1, maxOrdinate: 480, angleOfFall: 82.3, windDrift: 43, windRange: 13 },
              { range: 400, elevation: 1379, tof: 19.5, dElev: 31, tofPer100m: 0.1, maxOrdinate: 469, angleOfFall: 79.2, windDrift: 32, windRange: 14 },
              { range: 500, elevation: 1317, tof: 19.3, dElev: 32, tofPer100m: 0.2, maxOrdinate: 455, angleOfFall: 76.0, windDrift: 25, windRange: 15 },
              { range: 600, elevation: 1250, tof: 18.8, dElev: 35, tofPer100m: 0.2, maxOrdinate: 436, angleOfFall: 71.5, windDrift: 20, windRange: 16 },
              { range: 700, elevation: 1176, tof: 18.3, dElev: 43, maxOrdinate: 412, angleOfFall: 68.6, windDrift: 17, windRange: 17 },
              { range: 800, elevation: 1087, tof: 17.6, dElev: 57, tofPer100m: 0.6, maxOrdinate: 378, angleOfFall: 62.9, windDrift: 14, windRange: 18 },
              { range: 900, elevation: 958, tof: 16.2, dElev: 139, tofPer100m: 1.7 }
            ]
          },
          {
            chargeId: 'm821-he-2',
            name: 'Charge 2',
            rings: 2,
            minRange: 200,
            maxRange: 1600,
            rows: [
              { range: 200, elevation: 1538, tof: 26.6, dElev: 15, maxOrdinate: 870, angleOfFall: 87.7, windDrift: 169, windRange: 26 },
              { range: 300, elevation: 1507, tof: 26.6, dElev: 15, tofPer100m: 0.1, maxOrdinate: 865, angleOfFall: 85.2, windDrift: 88, windRange: 27 },
              { range: 400, elevation: 1476, tof: 26.5, dElev: 16, tofPer100m: 0.1, maxOrdinate: 860, angleOfFall: 84.6, windDrift: 77, windRange: 27 },
              { range: 500, elevation: 1444, tof: 26.4, dElev: 17, tofPer100m: 0.1, maxOrdinate: 852, angleOfFall: 82.1, windDrift: 54, windRange: 29 },
              { range: 600, elevation: 1411, tof: 26.2, dElev: 17, tofPer100m: 0.1, maxOrdinate: 843, angleOfFall: 80.4, windDrift: 45, windRange: 30 },
              { range: 700, elevation: 1377, tof: 26.0, dElev: 18, tofPer100m: 0.1, maxOrdinate: 832, angleOfFall: 79.6, windDrift: 41, windRange: 31 },
              { range: 800, elevation: 1342, tof: 25.8, dElev: 18, tofPer100m: 0.1, maxOrdinate: 818, angleOfFall: 77.0, windDrift: 34, windRange: 33 },
              { range: 900, elevation: 1305, tof: 25.6, dElev: 19, tofPer100m: 0.2, maxOrdinate: 802, angleOfFall: 75.2, windDrift: 30, windRange: 34 },
              { range: 1000, elevation: 1267, tof: 25.3, dElev: 20, tofPer100m: 0.2, maxOrdinate: 784, angleOfFall: 74.2, windDrift: 28, windRange: 35 },
              { range: 1100, elevation: 1226, tof: 24.9, dElev: 22, tofPer100m: 0.2, maxOrdinate: 762, angleOfFall: 70.4, windDrift: 24, windRange: 37 },
              { range: 1200, elevation: 1182, tof: 24.5, dElev: 24, tofPer100m: 0.3, maxOrdinate: 735, angleOfFall: 70.0, windDrift: 23, windRange: 38 },
              { range: 1300, elevation: 1133, tof: 24.0, dElev: 26, tofPer100m: 0.4, maxOrdinate: 704, angleOfFall: 67.5, windDrift: 21, windRange: 39 },
              { range: 1400, elevation: 1077, tof: 23.3, dElev: 30, tofPer100m: 0.4, maxOrdinate: 666, angleOfFall: 64.7, windDrift: 19, windRange: 40 },
              { range: 1500, elevation: 1011, tof: 22.4, dElev: 42, tofPer100m: 0.6, maxOrdinate: 616, angleOfFall: 60.4, windDrift: 17, windRange: 40 },
              { range: 1600, elevation: 916, tof: 21.0, dElev: 104, tofPer100m: 1.8, maxOrdinate: 541, angleOfFall: 56.4, windDrift: 15, windRange: 40 }
            ]
          },
          {
            chargeId: 'm821-he-3',
            name: 'Charge 3',
            rings: 3,
            minRange: 300,
            maxRange: 2300,
            rows: [
              { range: 300, elevation: 1534, tof: 31.7, dElev: 11, maxOrdinate: 1236, angleOfFall: 87.6, windDrift: 190, windRange: 43 },
              { range: 400, elevation: 1511, tof: 31.7, dElev: 11, maxOrdinate: 1231, angleOfFall: 85.6, windDrift: 108, windRange: 44 },
              { range: 500, elevation: 1489, tof: 31.6, dElev: 12, maxOrdinate: 1227, angleOfFall: 85.4, windDrift: 100, windRange: 45 },
              { range: 600, elevation: 1466, tof: 31.5, dElev: 12, maxOrdinate: 1220, angleOfFall: 83.5, windDrift: 73, windRange: 46 },
              { range: 700, elevation: 1443, tof: 31.4, dElev: 12, maxOrdinate: 1212, angleOfFall: 82.4, windDrift: 63, windRange: 48 },
              { range: 800, elevation: 1419, tof: 31.3, dElev: 12, maxOrdinate: 1203, angleOfFall: 81.3, windDrift: 55, windRange: 49 },
              { range: 900, elevation: 1395, tof: 31.2, dElev: 12, tofPer100m: 0.1, maxOrdinate: 1192, angleOfFall: 80.1, windDrift: 49, windRange: 50 },
              { range: 1000, elevation: 1370, tof: 31.0, dElev: 12, tofPer100m: 0.1 },
              { range: 1100, elevation: 1345, tof: 30.8, dElev: 13, tofPer100m: 0.1 },
              { range: 1200, elevation: 1319, tof: 30.6, dElev: 14 },
              { range: 1300, elevation: 1292, tof: 30.4, dElev: 14, tofPer100m: 0.2, maxOrdinate: 1132, angleOfFall: 75.3, windDrift: 34, windRange: 56 },
              { range: 1400, elevation: 1263, tof: 30.1, dElev: 14, tofPer100m: 0.1, maxOrdinate: 1112, angleOfFall: 74.7, windDrift: 33, windRange: 57 },
              { range: 1500, elevation: 1234, tof: 29.8, dElev: 15, tofPer100m: 0.2, maxOrdinate: 1090, angleOfFall: 72.5, windDrift: 30, windRange: 59 },
              { range: 1600, elevation: 1203, tof: 29.5, dElev: 16, tofPer100m: 0.2, maxOrdinate: 1065, angleOfFall: 71.1, windDrift: 28, windRange: 61 },
              { range: 1700, elevation: 1170, tof: 29.1, dElev: 17, tofPer100m: 0.3, maxOrdinate: 1036, angleOfFall: 69.5, windDrift: 26, windRange: 62 },
              { range: 1800, elevation: 1134, tof: 28.6, dElev: 19, tofPer100m: 0.3, maxOrdinate: 1003, angleOfFall: 68.6, windDrift: 25, windRange: 62 },
              { range: 1900, elevation: 1096, tof: 28.1, dElev: 22, tofPer100m: 0.4, maxOrdinate: 967, angleOfFall: 65.9, windDrift: 23, windRange: 64 },
              { range: 2000, elevation: 1052, tof: 27.4, dElev: 25, tofPer100m: 0.4, maxOrdinate: 922, angleOfFall: 63.8, windDrift: 21, windRange: 64 },
              { range: 2100, elevation: 1001, tof: 26.6, dElev: 31, tofPer100m: 0.6, maxOrdinate: 867, angleOfFall: 61.2, windDrift: 19, windRange: 65 },
              { range: 2200, elevation: 935, tof: 25.4, dElev: 44, tofPer100m: 0.8, maxOrdinate: 793, angleOfFall: 57.8, windRange: 64 },
              { range: 2300, elevation: 812, tof: 23.0, maxOrdinate: 648, angleOfFall: 50.1, windDrift: 14, windRange: 59 }
            ]
          },
          {
            chargeId: 'm821-he-4',
            name: 'Charge 4',
            rings: 4,
            minRange: 400,
            maxRange: 2900,
            rows: [
              { range: 400, elevation: 1531, tof: 36.3, maxOrdinate: 1619, angleOfFall: 87.6, windDrift: 208, windRange: 63 },
              { range: 500, elevation: 1514, tof: 36.3, maxOrdinate: 1615, angleOfFall: 86.0, windDrift: 127, windRange: 65 },
              { range: 600, elevation: 1496, tof: 36.2, maxOrdinate: 1610, angleOfFall: 85.2, windDrift: 106, windRange: 66 },
              { range: 700, elevation: 1478, tof: 36.2, tofPer100m: 0.1, maxOrdinate: 1603, angleOfFall: 85.1, windDrift: 105, windRange: 66 },
              { range: 800, elevation: 1460, tof: 36.1, tofPer100m: 0.1, maxOrdinate: 1596, angleOfFall: 83.5, windDrift: 80, windRange: 68 },
              { range: 900, elevation: 1442, tof: 36.0, tofPer100m: 0.1, maxOrdinate: 1588, angleOfFall: 82.7, windDrift: 71, windRange: 69 },
              { range: 1000, elevation: 1424, tof: 35.9, dElev: 10, tofPer100m: 0.1, maxOrdinate: 1579, angleOfFall: 82.7, windDrift: 71, windRange: 69 },
              { range: 1100, elevation: 1405, tof: 35.8, tofPer100m: 0.1, maxOrdinate: 1568, angleOfFall: 81.0, windDrift: 59, windRange: 72 },
              { range: 1200, elevation: 1386, tof: 35.6, dElev: 10 },
              { range: 1300, elevation: 1366, tof: 35.5, tofPer100m: 0.1, maxOrdinate: 1543, angleOfFall: 79.3, windDrift: 50, windRange: 75 },
              { range: 1400, elevation: 1347, tof: 35.3, dElev: 11, tofPer100m: 0.1 },
              { range: 1500, elevation: 1326, tof: 35.1, dElev: 10, tofPer100m: 0.1 },
              { range: 1600, elevation: 1305, tof: 34.9, dElev: 10, tofPer100m: 0.1, maxOrdinate: 1496, angleOfFall: 76.5, windDrift: 41, windRange: 80 },
              { range: 1700, elevation: 1284, tof: 34.7, dElev: 11, tofPer100m: 0.1, maxOrdinate: 1478, angleOfFall: 75.6, windDrift: 38 },
              { range: 1800, elevation: 1262, tof: 34.5, dElev: 12, tofPer100m: 0.2, maxOrdinate: 1458, angleOfFall: 74.6, windDrift: 36, windRange: 83 },
              { range: 1900, elevation: 1238, tof: 34.2, dElev: 12, tofPer100m: 0.2, maxOrdinate: 1434, angleOfFall: 73.5, windDrift: 34, windRange: 84 },
              { range: 2000, elevation: 1214, tof: 33.9, dElev: 12, tofPer100m: 0.2, maxOrdinate: 1410, angleOfFall: 71.7, windDrift: 31, windRange: 87 },
              { range: 2100, elevation: 1189, tof: 33.6, dElev: 13, tofPer100m: 0.2, maxOrdinate: 1381, angleOfFall: 72.1, windDrift: 32, windRange: 86 },
              { range: 2200, elevation: 1163, tof: 33.2, dElev: 13 },
              { range: 2300, elevation: 1135, tof: 32.8, dElev: 15, tofPer100m: 0.3, maxOrdinate: 1318, angleOfFall: 69.7, windDrift: 28, windRange: 89 },
              { range: 2400, elevation: 1105, tof: 32.3, dElev: 16, tofPer100m: 0.3, maxOrdinate: 1281, angleOfFall: 67.5, windDrift: 26, windRange: 90 },
              { range: 2500, elevation: 1072, tof: 31.7, dElev: 17, tofPer100m: 0.2, maxOrdinate: 1238, angleOfFall: 66.8, windDrift: 25, windRange: 91 },
              { range: 2600, elevation: 1036, tof: 31.1, dElev: 20, tofPer100m: 0.4, maxOrdinate: 1189, angleOfFall: 64.3, windDrift: 23, windRange: 91 },
              { range: 2700, elevation: 995, tof: 30.4, dElev: 24, tofPer100m: 0.5, maxOrdinate: 1132, angleOfFall: 62.3, windDrift: 22, windRange: 91 },
              { range: 2800, elevation: 946, tof: 29.4, dElev: 32, maxOrdinate: 1060, angleOfFall: 59.8, windDrift: 20, windRange: 91 },
              { range: 2900, elevation: 875, tof: 27.9, dElev: 60, tofPer100m: 1.4, maxOrdinate: 953, angleOfFall: 56.2, windDrift: 18, windRange: 88 }
            ]
          }
        ]
      },
      {
        id: 'm819-smoke',
        name: 'M819 Smoke',
        category: 'smoke',
        charges: [
          {
            chargeId: 'm819-smoke-0',
            name: 'Charge 0',
            rings: 0,
            minRange: 200,
            maxRange: 750,
            rows: [
              { range: 200, elevation: 1463, tof: 17.7, dElev: 35, tofPer100m: 0.1, maxOrdinate: 387, angleOfFall: 82.8, windDrift: 68, windRange: 15 },
              { range: 300, elevation: 1392, tof: 17.5, dElev: 39, tofPer100m: 0.1, maxOrdinate: 378, angleOfFall: 79.2, windDrift: 46, windRange: 16 },
              { range: 400, elevation: 1314, tof: 17.2, dElev: 42, tofPer100m: 0.2, maxOrdinate: 364, angleOfFall: 75.2, windDrift: 35, windRange: 17 },
              { range: 500, elevation: 1228, tof: 16.7, dElev: 48, tofPer100m: 0.3, maxOrdinate: 344, angleOfFall: 70.8, windDrift: 28, windRange: 19 },
              { range: 600, elevation: 1126, tof: 16.0, dElev: 63, tofPer100m: 0.5, maxOrdinate: 315, angleOfFall: 66.4, windDrift: 23, windRange: 20 },
              { range: 700, elevation: 986, tof: 14.8, dElev: 150, tofPer100m: 1.6, maxOrdinate: 269, angleOfFall: 58.2, windDrift: 18, windRange: 21 },
              { range: 750, elevation: 836, tof: 13.2, maxOrdinate: 213, angleOfFall: 50.0, windDrift: 15, windRange: 20 }
            ]
          },
          {
            chargeId: 'm819-smoke-1',
            name: 'Charge 1',
            rings: 1,
            minRange: 200,
            maxRange: 1400,
            rows: [
              { range: 200, elevation: 1528, tof: 24.8, dElev: 19, maxOrdinate: 756, angleOfFall: 86.5, windDrift: 173, windRange: 35 },
              { range: 400, elevation: 1454, tof: 24.6, dElev: 20, maxOrdinate: 745, angleOfFall: 82.9, windDrift: 88, windRange: 37 },
              { range: 600, elevation: 1375, tof: 24.3, dElev: 20, tofPer100m: 0.1, maxOrdinate: 724, angleOfFall: 80.0, windDrift: 63, windRange: 40 },
              { range: 800, elevation: 1290, tof: 23.8, dElev: 24, tofPer100m: 0.2, maxOrdinate: 693, angleOfFall: 75.2, windDrift: 44, windRange: 45 },
              { range: 1000, elevation: 1192, tof: 23.0, dElev: 28, tofPer100m: 0.3, maxOrdinate: 647, angleOfFall: 70.6, windDrift: 35, windRange: 48 },
              { range: 1200, elevation: 1069, tof: 21.7, dElev: 38, tofPer100m: 0.5, maxOrdinate: 576, angleOfFall: 65.5, windDrift: 29, windRange: 51 },
              { range: 1400, elevation: 827, tof: 18.2, maxOrdinate: 408, angleOfFall: 52.1, windDrift: 20, windRange: 48 }
            ]
          }
        ]
      }
    ]
  },
  b2b14: {
    id: 'b2b14',
    name: '2B14 Podnos 82mm Mortar',
    nameAr: 'هاون 2B14 بودنس عيار 82 ملم',
    calibre: '82mm',
    milsPerCircle: 6000,
    minElevationMils: 748,
    maxElevationMils: 1415,
    minElevationDeg: 44.9,
    maxElevationDeg: 84.9,
    standard: 'Warsaw Pact',
    defaultRounds: [
      {
        id: 'o-832du',
        name: 'O-832DU HE',
        category: 'he',
        charges: [
          {
            chargeId: 'o-832du-0',
            name: 'Charge 0',
            rings: 0,
            minRange: 100,
            maxRange: 500,
            rows: [
              { range: 100, elevation: 1411, tof: 15.0, dElev: 46, tofPer100m: 0.1, maxOrdinate: 276, angleOfFall: 84.9, windDrift: 82, windRange: 9 },
              { range: 150, elevation: 1365, tof: 14.9, dElev: 46, tofPer100m: 0.1, maxOrdinate: 273, angleOfFall: 82.3, windDrift: 55, windRange: 9 },
              { range: 200, elevation: 1319, tof: 14.8, tofPer100m: 0.2, maxOrdinate: 269, angleOfFall: 79.7, windDrift: 42, windRange: 10 },
              { range: 250, elevation: 1269, tof: 14.6, dElev: 51, tofPer100m: 0.2, maxOrdinate: 263, angleOfFall: 76.9, windDrift: 33, windRange: 11 },
              { range: 350, elevation: 1160, tof: 14.1, dElev: 63, tofPer100m: 0.4, maxOrdinate: 245, angleOfFall: 70.8, windDrift: 24, windRange: 12 },
              { range: 400, elevation: 1097, tof: 13.7, dElev: 72, tofPer100m: 0.4, maxOrdinate: 232, angleOfFall: 67.3, windDrift: 21, windRange: 13 },
              { range: 450, elevation: 1025, tof: 13.3, dElev: 98, tofPer100m: 0.8, maxOrdinate: 216, angleOfFall: 63.2, windDrift: 18, windRange: 13 },
              { range: 500, elevation: 927, tof: 12.5, maxOrdinate: 190, angleOfFall: 57.7, windDrift: 15, windRange: 14 }
            ]
          },
          {
            chargeId: 'o-832du-1',
            name: 'Charge 1',
            rings: 1,
            minRange: 100,
            maxRange: 800,
            rows: [
              { range: 100, elevation: 1446, tof: 19.5, dElev: 27, maxOrdinate: 466, angleOfFall: 87.9, windDrift: 215, windRange: 18 },
              { range: 200, elevation: 1392, tof: 19.4, dElev: 28, tofPer100m: 0.1, maxOrdinate: 462, angleOfFall: 85.0, windDrift: 99, windRange: 19 },
              { range: 400, elevation: 1276, tof: 19.0, dElev: 31, tofPer100m: 0.2, maxOrdinate: 443, angleOfFall: 77.9, windDrift: 44, windRange: 22 },
              { range: 500, elevation: 1213, tof: 18.7, dElev: 35, tofPer100m: 0.3, maxOrdinate: 427, angleOfFall: 74.5, windDrift: 35, windRange: 24 },
              { range: 600, elevation: 1142, tof: 18.2, dElev: 39, tofPer100m: 0.3, maxOrdinate: 406, angleOfFall: 69.9, windDrift: 28, windRange: 26 },
              { range: 700, elevation: 1060, tof: 17.5, dElev: 48, tofPer100m: 0.4, maxOrdinate: 376, angleOfFall: 67.2, windDrift: 25, windRange: 27 },
              { range: 800, elevation: 955, tof: 16.5, dElev: 79, maxOrdinate: 333, angleOfFall: 61.4, windDrift: 21, windRange: 28 }
            ]
          },
          {
            chargeId: 'o-832du-2',
            name: 'Charge 2',
            rings: 2,
            minRange: 200,
            maxRange: 1400,
            rows: [
              { range: 200, elevation: 1432, tof: 24.8 },
              { range: 400, elevation: 1362, tof: 24.7, dElev: 18, tofPer100m: 0.1, maxOrdinate: 745, angleOfFall: 82.9, windDrift: 86, windRange: 39 },
              { range: 500, elevation: 1326, tof: 24.5, dElev: 19, tofPer100m: 0.1, maxOrdinate: 736, angleOfFall: 81.1, windDrift: 69, windRange: 41 },
              { range: 600, elevation: 1288, tof: 24.3, dElev: 19, tofPer100m: 0.1, maxOrdinate: 724, angleOfFall: 80.0, windDrift: 62, windRange: 42 },
              { range: 700, elevation: 1249, tof: 24.1, dElev: 20, tofPer100m: 0.2, maxOrdinate: 710, angleOfFall: 78.1, windDrift: 52, windRange: 44 },
              { range: 800, elevation: 1208, tof: 23.8, tofPer100m: 0.2, maxOrdinate: 692, angleOfFall: 75.2, windDrift: 44, windRange: 47 },
              { range: 900, elevation: 1163, tof: 23.4, maxOrdinate: 671, angleOfFall: 73.0, windDrift: 39, windRange: 49 },
              { range: 1000, elevation: 1115, tof: 22.9, dElev: 26, tofPer100m: 0.2, maxOrdinate: 645, angleOfFall: 71.4, windDrift: 36, windRange: 50 },
              { range: 1100, elevation: 1062, tof: 22.4, dElev: 30, tofPer100m: 0.4, maxOrdinate: 614, angleOfFall: 68.8, windDrift: 32, windRange: 52 },
              { range: 1200, elevation: 999, tof: 21.6, dElev: 37, tofPer100m: 0.5, maxOrdinate: 574, angleOfFall: 64.7, windDrift: 28, windRange: 53 },
              { range: 1300, elevation: 917, tof: 20.5, dElev: 55, tofPer100m: 0.8, maxOrdinate: 516, angleOfFall: 60.4, windDrift: 24, windRange: 53 },
              { range: 1400, elevation: 765, tof: 18.1, maxOrdinate: 401, angleOfFall: 50.7, windDrift: 19, windRange: 49 }
            ]
          },
          {
            chargeId: 'o-832du-3',
            name: 'Charge 3',
            rings: 3,
            minRange: 400,
            maxRange: 1800,
            rows: [
              { range: 400, elevation: 1397, tof: 28.9, dElev: 13 },
              { range: 500, elevation: 1370, tof: 28.8, dElev: 13, maxOrdinate: 1018, angleOfFall: 83.7, windDrift: 106, windRange: 60 },
              { range: 600, elevation: 1343, tof: 28.7, dElev: 14, tofPer100m: 0.1, maxOrdinate: 1010, angleOfFall: 83.2, windDrift: 97, windRange: 60 },
              { range: 700, elevation: 1316, tof: 28.6, dElev: 15, tofPer100m: 0.1, maxOrdinate: 1000, angleOfFall: 81.1, windDrift: 76, windRange: 63 },
              { range: 800, elevation: 1287, tof: 28.4, dElev: 15, tofPer100m: 0.1, maxOrdinate: 987, angleOfFall: 80.6, windDrift: 72, windRange: 64 },
              { range: 900, elevation: 1257, tof: 28.2, dElev: 15, tofPer100m: 0.2, maxOrdinate: 973, angleOfFall: 78.4, windDrift: 59, windRange: 67 },
              { range: 1000, elevation: 1227, tof: 27.9, dElev: 16, tofPer100m: 0.1 },
              { range: 1100, elevation: 1194, tof: 27.6, dElev: 16, tofPer100m: 0.1 },
              { range: 1200, elevation: 1160, tof: 27.3, dElev: 18, tofPer100m: 0.2 },
              { range: 1400, elevation: 1085, tof: 26.4, dElev: 21, tofPer100m: 0.2, maxOrdinate: 858, angleOfFall: 70.4, windDrift: 37, windRange: 77 },
              { range: 1500, elevation: 1042, tof: 25.9, dElev: 24, maxOrdinate: 822, angleOfFall: 68.3, windDrift: 34, windRange: 78 },
              { range: 1600, elevation: 993, tof: 25.2, dElev: 28, tofPer100m: 0.4, maxOrdinate: 779, angleOfFall: 65.9, windDrift: 31, windRange: 79 },
              { range: 1700, elevation: 935, tof: 24.3, dElev: 36, tofPer100m: 0.6, maxOrdinate: 725, angleOfFall: 63.0, windDrift: 29, windRange: 79 },
              { range: 1800, elevation: 855, tof: 22.9, dElev: 62, tofPer100m: 1.2, maxOrdinate: 645, angleOfFall: 59.7, windDrift: 26, windRange: 78 }
            ]
          }
        ]
      }
    ]
  }
};
