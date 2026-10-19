import React, { useRef } from 'react';
import { Move, Lock, EyeOff, Maximize2 } from 'lucide-react';
import { UIElementConfig, UIElementId } from '../types/customization';

interface CustomizableElementWrapperProps {
  id: UIElementId;
  config: UIElementConfig;
  isCustomizing: boolean;
  isSelected: boolean;
  isPreviewing: boolean;
  onSelect: (id: UIElementId) => void;
  onUpdateConfig: (id: UIElementId, partial: Partial<UIElementConfig>) => void;
  className?: string;
  transformOrigin?: string;
  children: React.ReactNode;
}

export const CustomizableElementWrapper: React.FC<CustomizableElementWrapperProps> = ({
  id,
  config,
  isCustomizing,
  isSelected,
  isPreviewing,
  onSelect,
  onUpdateConfig,
  className = '',
  transformOrigin = 'top left',
  children,
}) => {
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, initialOffsetX: 0, initialOffsetY: 0, initialScale: 1 });

  if (!config.visible && !isCustomizing) {
    return null;
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCustomizing || isPreviewing || config.locked) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a') && !target.closest('.customizer-drag-handle')) {
      return;
    }
    e.stopPropagation();
    onSelect(id);
    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffsetX: config.offsetX,
      initialOffsetY: config.offsetY,
      initialScale: config.scale,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - startPosRef.current.x;
      const dy = moveEvent.clientY - startPosRef.current.y;
      onUpdateConfig(id, {
        offsetX: Math.round(startPosRef.current.initialOffsetX + dx),
        offsetY: Math.round(startPosRef.current.initialOffsetY + dy),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCustomizing || isPreviewing || config.locked) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select') && !target.closest('.customizer-drag-handle')) {
      return;
    }
    e.stopPropagation();
    onSelect(id);
    const touch = e.touches[0];
    isDraggingRef.current = true;
    startPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      initialOffsetX: config.offsetX,
      initialOffsetY: config.offsetY,
      initialScale: config.scale,
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const moveTouch = moveEvent.touches[0];
      const dx = moveTouch.clientX - startPosRef.current.x;
      const dy = moveTouch.clientY - startPosRef.current.y;
      onUpdateConfig(id, {
        offsetX: Math.round(startPosRef.current.initialOffsetX + dx),
        offsetY: Math.round(startPosRef.current.initialOffsetY + dy),
      });
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isCustomizing || isPreviewing || config.locked) return;
    e.stopPropagation();
    onSelect(id);
    isResizingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    startPosRef.current = {
      x: clientX,
      y: clientY,
      initialOffsetX: config.offsetX,
      initialOffsetY: config.offsetY,
      initialScale: config.scale,
    };

    const handleResizeMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const curX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const curY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const delta = (curX - startPosRef.current.x + (curY - startPosRef.current.y)) / 2;
      const newScale = Math.max(0.70, Math.min(1.35, Number((startPosRef.current.initialScale + delta / 250).toFixed(2))));
      onUpdateConfig(id, { scale: newScale });
    };

    const handleResizeEnd = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleResizeMove as any);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove as any);
      window.removeEventListener('touchend', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove as any);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove as any);
    window.addEventListener('touchend', handleResizeEnd);
  };

  const style: React.CSSProperties = {
    transform: `translate3d(${config.offsetX}px, ${config.offsetY}px, 0) scale(${config.scale})`,
    transformOrigin,
    opacity: config.visible ? config.opacity : (isCustomizing && !isPreviewing ? 0.4 : 0),
    pointerEvents: !config.visible && !isCustomizing ? 'none' : undefined,
    transition: isDraggingRef.current || isResizingRef.current ? 'none' : 'transform 0.1s ease-out, opacity 0.15s ease',
  };

  return (
    <div
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        if (isCustomizing && !isPreviewing) {
          e.stopPropagation();
          onSelect(id);
        }
      }}
      className={`relative ${className} ${
        isCustomizing && !isPreviewing
          ? isSelected
            ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-neutral-950 rounded-lg cursor-grab active:cursor-grabbing shadow-2xl'
            : 'ring-1 ring-cyan-500/60 ring-dashed hover:ring-amber-400 rounded-lg cursor-pointer'
          : ''
      }`}
    >
      {isCustomizing && !isPreviewing && (
        <div className="absolute -top-5 left-1 z-[999] flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-950/95 border border-amber-500/80 shadow text-[9px] font-mono text-amber-400 pointer-events-auto">
          <Move className="w-2.5 h-2.5 customizer-drag-handle" />
          <span className="font-tactical font-semibold truncate max-w-[110px]">{config.name}</span>
          {config.locked && <Lock className="w-2.5 h-2.5 text-red-400" />}
          {!config.visible && <EyeOff className="w-2.5 h-2.5 text-neutral-500" />}
        </div>
      )}
      {isCustomizing && isSelected && !isPreviewing && !config.locked && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className="absolute -bottom-2 -right-2 z-[999] w-5 h-5 rounded-full bg-amber-500 border border-neutral-950 flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
          title="Drag to resize element scale"
        >
          <Maximize2 className="w-2.5 h-2.5 text-neutral-950" />
        </div>
      )}
      {children}
    </div>
  );
};
