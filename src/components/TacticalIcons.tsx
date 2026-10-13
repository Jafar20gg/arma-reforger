import React from 'react';

export const MortarIconSvg = ({ size = 28, color = '#38bdf8' }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
  >
    {/* Base circle */}
    <circle cx="18" cy="18" r="16" fill="#0f172a" stroke={color} strokeWidth="2.5" />
    <circle cx="18" cy="18" r="12" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    
    {/* Crosshairs */}
    <line x1="18" y1="2" x2="18" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="28" x2="18" y2="34" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="18" x2="8" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="18" x2="34" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    
    {/* Mortar tube silhouette */}
    <path
      d="M14 24L17 11L19 11L22 24L19 25L18 20L17 25Z"
      fill={color}
    />
    <circle cx="18" cy="18" r="2" fill="#0f172a" />
  </svg>
);

export const TargetIconSvg = ({
  size = 28,
  color = '#ef4444',
  label = '',
}: {
  size?: number;
  color?: string;
  label?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
  >
    {/* Outer reticle */}
    <circle cx="18" cy="18" r="16" fill="#18181b" stroke={color} strokeWidth="2.5" />
    <circle cx="18" cy="18" r="10" fill="none" stroke={color} strokeWidth="1.5" />
    <circle cx="18" cy="18" r="3" fill={color} />

    {/* Reticle ticks */}
    <line x1="18" y1="2" x2="18" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="28" x2="18" y2="34" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="18" x2="8" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="18" x2="34" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />

    {label ? (
      <text
        x="18"
        y="13"
        fill="#ffffff"
        fontSize="7"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
    ) : null}
  </svg>
);
