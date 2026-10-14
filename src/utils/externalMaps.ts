/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TerrainId } from '../types';

export const DEFAULT_TACOPS_BASE = 'https://app.tacops.gg/m/{terrain}';
export const DEFAULT_TACOPS_PARAMS = '?v={zoom}/{x}/{y}';

export interface TacOpsSettings {
  baseTemplate: string;
  paramTemplate: string;
}

const STORAGE_KEY_BASE = 'reforger_tacops_base_template';
const STORAGE_KEY_PARAMS = 'reforger_tacops_param_template';

export function getTacOpsSettings(): TacOpsSettings {
  const base = localStorage.getItem(STORAGE_KEY_BASE) || DEFAULT_TACOPS_BASE;
  const params = localStorage.getItem(STORAGE_KEY_PARAMS) !== null
    ? localStorage.getItem(STORAGE_KEY_PARAMS) || ''
    : DEFAULT_TACOPS_PARAMS;

  return {
    baseTemplate: base,
    paramTemplate: params,
  };
}

export function saveTacOpsSettings(settings: TacOpsSettings): void {
  localStorage.setItem(STORAGE_KEY_BASE, settings.baseTemplate.trim());
  localStorage.setItem(STORAGE_KEY_PARAMS, settings.paramTemplate.trim());
}

export function resetTacOpsSettings(): TacOpsSettings {
  localStorage.removeItem(STORAGE_KEY_BASE);
  localStorage.removeItem(STORAGE_KEY_PARAMS);
  return {
    baseTemplate: DEFAULT_TACOPS_BASE,
    paramTemplate: DEFAULT_TACOPS_PARAMS,
  };
}

export function buildTacOpsUrl(
  terrainId: TerrainId,
  zoom: number = 3,
  x: number = 6400,
  y: number = 6400
): string {
  const { baseTemplate, paramTemplate } = getTacOpsSettings();

  // TacOps terrain ids: everon, arland, kolguyev
  let url = baseTemplate.replace(/{terrain}/g, terrainId.toLowerCase());

  if (paramTemplate) {
    const params = paramTemplate
      .replace(/{terrain}/g, terrainId.toLowerCase())
      .replace(/{zoom}/g, String(Math.round(zoom)))
      .replace(/{x}/g, String(Math.round(x)))
      .replace(/{y}/g, String(Math.round(y)));

    if (!url.includes('?') && params.startsWith('?')) {
      url += params;
    } else if (url.includes('?') && params.startsWith('?')) {
      url += '&' + params.substring(1);
    } else {
      url += params;
    }
  }

  return url;
}

export function buildRecoilUrl(terrainId: TerrainId): string {
  // Direct plain links with attribution to independent site
  return `https://reforger.recoil.org/${terrainId.toLowerCase()}`;
}
