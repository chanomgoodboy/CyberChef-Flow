import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { MenuEntry } from './ContextMenu';
import { copyToClipboard } from '@/utils/clipboard';
import { StegCanvas } from './steg/StegCanvas';
import { STEG_MODES, STEG_MODE_COUNT } from './steg/stegModes';

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  /** Extra context-menu items injected by parent (e.g. "Save Image…") */
  extraMenuItems?: MenuEntry[];
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 20;
const ZOOM_STEP = 1.06;
const RULER_SIZE = 22;

interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/*  Ruler drawing helpers                                               */
/* ------------------------------------------------------------------ */

const TICK_SPACINGS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const MIN_TICK_GAP = 50;
const RULER_BG = '#16213e';
const RULER_BORDER = '#2a2a4a';
const TICK_COLOR = '#6b6b80';
const TICK_MINOR = '#3a3a5a';
const LABEL_COLOR = '#a0a0b0';
const RULER_FONT = "9px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function pickSpacing(pxPerImg: number) {
  return TICK_SPACINGS.find((s) => s * pxPerImg >= MIN_TICK_GAP) ?? 5000;
}

function drawHRuler(
  canvas: HTMLCanvasElement,
  containerRect: DOMRect,
  imgRect: DOMRect,
  naturalW: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = RULER_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = RULER_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0.5);
  ctx.lineTo(w, 0.5);
  ctx.stroke();

  const pxPerImg = imgRect.width / naturalW;
  if (!pxPerImg || !isFinite(pxPerImg)) return;
  const spacing = pickSpacing(pxPerImg);
  const imgOffset = imgRect.left - containerRect.left;

  const startX = Math.max(0, Math.floor(-imgOffset / pxPerImg / spacing) * spacing);
  const endX = Math.min(
    naturalW,
    Math.ceil((w - imgOffset) / pxPerImg / spacing) * spacing + spacing,
  );

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = RULER_FONT;

  for (let px = startX; px <= endX; px += spacing) {
    const x = Math.round(imgOffset + px * pxPerImg) + 0.5;
    if (x < -20 || x > w + 20) continue;
    ctx.strokeStyle = TICK_COLOR;
    ctx.beginPath();
    ctx.moveTo(x, 1);
    ctx.lineTo(x, 7);
    ctx.stroke();
    ctx.fillStyle = LABEL_COLOR;
    ctx.fillText(String(px), x, h - 2);
  }

  const minor = spacing / 5;
  if (minor >= 1 && minor * pxPerImg >= 4) {
    ctx.strokeStyle = TICK_MINOR;
    for (
      let px = Math.max(0, startX - spacing);
      px <= Math.min(naturalW, endX + spacing);
      px += minor
    ) {
      if (px % spacing === 0) continue;
      const x = Math.round(imgOffset + px * pxPerImg) + 0.5;
      if (x < 0 || x > w) continue;
      ctx.beginPath();
      ctx.moveTo(x, 1);
      ctx.lineTo(x, 4);
      ctx.stroke();
    }
  }
}

function drawVRuler(
  canvas: HTMLCanvasElement,
  containerRect: DOMRect,
  imgRect: DOMRect,
  naturalH: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = RULER_BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = RULER_BORDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 0.5, 0);
  ctx.lineTo(w - 0.5, h);
  ctx.stroke();

  const pxPerImg = imgRect.height / naturalH;
  if (!pxPerImg || !isFinite(pxPerImg)) return;
  const spacing = pickSpacing(pxPerImg);
  const imgOffset = imgRect.top - containerRect.top;

  const startY = Math.max(0, Math.floor(-imgOffset / pxPerImg / spacing) * spacing);
  const endY = Math.min(
    naturalH,
    Math.ceil((h - imgOffset) / pxPerImg / spacing) * spacing + spacing,
  );

  ctx.font = RULER_FONT;

  for (let py = startY; py <= endY; py += spacing) {
    const y = Math.round(imgOffset + py * pxPerImg) + 0.5;
    if (y < -20 || y > h + 20) continue;
    ctx.strokeStyle = TICK_COLOR;
    ctx.beginPath();
    ctx.moveTo(w - 1, y);
    ctx.lineTo(w - 7, y);
    ctx.stroke();
    ctx.save();
    ctx.translate(w / 2 - 2, y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = LABEL_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(py), 0, 0);
    ctx.restore();
  }

  const minor = spacing / 5;
  if (minor >= 1 && minor * pxPerImg >= 4) {
    ctx.strokeStyle = TICK_MINOR;
    for (
      let py = Math.max(0, startY - spacing);
      py <= Math.min(naturalH, endY + spacing);
      py += minor
    ) {
      if (py % spacing === 0) continue;
      const y = Math.round(imgOffset + py * pxPerImg) + 0.5;
      if (y < 0 || y > h) continue;
      ctx.beginPath();
      ctx.moveTo(w - 1, y);
      ctx.lineTo(w - 4, y);
      ctx.stroke();
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ZoomableImage = React.memo(function ZoomableImage({
  src,
  alt = 'Output',
  className,
  extraMenuItems,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [pixelColor, setPixelColor] = useState<PixelColor | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [showRulers, setShowRulers] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Steg state
  const [stegMode, setStegMode] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);

  // Reset steg mode when image source changes
  useEffect(() => {
    setStegMode(0);
  }, [src]);

  // Track container size for ruler canvas sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw image to offscreen canvas for pixel color picker (always original values)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        offscreenCanvasRef.current = canvas;
        offscreenCtxRef.current = ctx;
      }
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = src;
    return () => {
      offscreenCanvasRef.current = null;
      offscreenCtxRef.current = null;
    };
  }, [src]);

  // Draw rulers when relevant state changes
  useEffect(() => {
    if (!showRulers || !imgSize.w || !imgSize.h) return;
    const container = containerRef.current;
    const displayEl = displayRef.current;
    if (!container || !displayEl) return;

    const raf = requestAnimationFrame(() => {
      const cr = container.getBoundingClientRect();
      const ir = displayEl.getBoundingClientRect();
      if (hRulerRef.current) drawHRuler(hRulerRef.current, cr, ir, imgSize.w);
      if (vRulerRef.current) drawVRuler(vRulerRef.current, cr, ir, imgSize.h);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRulers, scale, translate, imgSize, containerSize]);

  /* ---- Pixel colour picker ---- */

  const pickColor = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const displayEl = displayRef.current;
      const ctx = offscreenCtxRef.current;
      const canvas = offscreenCanvasRef.current;
      if (!container || !displayEl || !ctx || !canvas) {
        setPixelColor(null);
        return;
      }
      const rect = container.getBoundingClientRect();
      const imgRect = displayEl.getBoundingClientRect();
      const mx = clientX - imgRect.left;
      const my = clientY - imgRect.top;
      const px = Math.floor((mx / imgRect.width) * canvas.width);
      const py = Math.floor((my / imgRect.height) * canvas.height);

      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
        setPixelColor(null);
        return;
      }
      const data = ctx.getImageData(px, py, 1, 1).data;
      const r = data[0],
        g = data[1],
        b = data[2],
        a = data[3];
      const hex =
        '#' +
        [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
      setCursorPos({ x: clientX - rect.left, y: clientY - rect.top });
      setPixelColor({ r, g, b, a, hex, x: px, y: py });
    },
    [],
  );

  /* ---- Pan & zoom handlers ---- */

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
      const ratio = next / prev;
      setTranslate((t) => ({
        x: cx - ratio * (cx - t.x),
        y: cy - ratio * (cy - t.y),
      }));
      return next;
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Any click outside the panel closes the context menu
      if (ctxMenu) {
        if (!(e.target as HTMLElement).closest('.image-context-panel')) {
          setCtxMenu(null);
        }
        return;
      }
      if (e.button !== 0) return;
      // Don't start drag if clicking steg toolbar
      if ((e.target as HTMLElement).closest('.steg-toolbar')) return;
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    },
    [translate, ctxMenu],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Freeze colour picker while context panel is open
      if (!ctxMenu) pickColor(e.clientX, e.clientY);
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    },
    [dragging, pickColor, ctxMenu],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragging(false);
    if (!ctxMenu) setPixelColor(null);
  }, [ctxMenu]);

  const handleDoubleClick = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  /* ---- Steg mode cycling ---- */

  const prevMode = useCallback(() => {
    setStegMode((m) => (m - 1 + STEG_MODE_COUNT) % STEG_MODE_COUNT);
  }, []);

  const nextMode = useCallback(() => {
    setStegMode((m) => (m + 1) % STEG_MODE_COUNT);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        prevMode();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        nextMode();
      }
    },
    [prevMode, nextMode],
  );

  /* ---- Context menu (positioned absolutely on image) ---- */

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Close on Escape, and on any click outside the panel
  useEffect(() => {
    if (!ctxMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCtxMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      // Don't close when clicking on the portal panel itself
      if ((e.target as HTMLElement).closest('.image-context-panel')) return;
      setCtxMenu(null);
    };
    document.addEventListener('keydown', onKey);
    const tid = setTimeout(() => document.addEventListener('mousedown', onDown), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(tid);
      document.removeEventListener('mousedown', onDown);
    };
  }, [ctxMenu]);

  const ctxMenuItems = useMemo((): MenuEntry[] => {
    const items: MenuEntry[] = [];

    if (pixelColor) {
      items.push({
        label: `Copy Color ${pixelColor.hex.toUpperCase()}`,
        action: () => {
          copyToClipboard(pixelColor.hex.toUpperCase());
        },
      });
      items.push({
        label: `Copy Color RGB(${pixelColor.r}, ${pixelColor.g}, ${pixelColor.b})`,
        action: () => {
          copyToClipboard(
            `${pixelColor.r}, ${pixelColor.g}, ${pixelColor.b}`,
          );
        },
      });
      items.push({
        label: `Copy Position (${pixelColor.x}, ${pixelColor.y})`,
        action: () => {
          copyToClipboard(`${pixelColor.x}, ${pixelColor.y}`);
        },
      });
      items.push({ separator: true });
    }

    items.push({
      label: 'Copy Image',
      action: async () => {
        const canvas = offscreenCanvasRef.current;
        if (!canvas) return;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ [blob.type]: blob }),
            ]);
          } catch {
            /* browser may not support clipboard image */
          }
        }
      },
    });

    if (extraMenuItems && extraMenuItems.length > 0) {
      items.push({ separator: true });
      items.push(...extraMenuItems);
    }

    items.push({ separator: true });

    if (stegMode !== 0) {
      items.push({
        label: 'Reset Steg Mode',
        action: () => setStegMode(0),
      });
    }

    items.push({
      label: showRulers ? 'Hide Rulers' : 'Show Rulers',
      action: () => setShowRulers((v) => !v),
    });
    items.push({
      label: 'Reset View',
      action: () => {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      },
    });

    return items;
  }, [pixelColor, showRulers, extraMenuItems, stegMode]);

  /* ---- Ref callbacks ---- */

  const stegCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    displayRef.current = node;
  }, []);

  const imgFallbackRef = useCallback((node: HTMLImageElement | null) => {
    displayRef.current = node;
  }, []);

  /* ---- Render ---- */

  const transformStyle = {
    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
  };

  const currentMode = STEG_MODES[stegMode];

  return (
    <>
    <div
      ref={containerRef}
      className={`zoomable-image-container nodrag nowheel${className ? ` ${className}` : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ cursor: ctxMenu ? 'default' : dragging ? 'grabbing' : 'crosshair', outline: 'none' }}
    >
      {webglFailed ? (
        <img
          ref={imgFallbackRef}
          src={src}
          alt={alt}
          className="zoomable-image"
          draggable={false}
          style={transformStyle}
        />
      ) : (
        <StegCanvas
          ref={stegCanvasRef}
          src={src}
          mode={stegMode}
          className="zoomable-image"
          style={transformStyle}
          onNaturalSize={(w, h) => setImgSize({ w, h })}
          onWebGLUnsupported={() => setWebglFailed(true)}
        />
      )}

      {/* Steg toolbar */}
      {!webglFailed && (
        <div
          className={`steg-toolbar${stegMode !== 0 ? ' steg-active' : ''}`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="steg-nav-btn"
            onClick={prevMode}
            title="Previous mode (Left Arrow)"
          >
            &#9664;
          </button>
          <span className="steg-mode-label">{currentMode?.name ?? 'Normal'}</span>
          <button
            className="steg-nav-btn"
            onClick={nextMode}
            title="Next mode (Right Arrow)"
          >
            &#9654;
          </button>
        </div>
      )}

      {/* Pixel rulers */}
      {showRulers && (
        <>
          <canvas ref={hRulerRef} className="pixel-ruler pixel-ruler-h" />
          <canvas ref={vRulerRef} className="pixel-ruler pixel-ruler-v" />
          <div className="pixel-ruler-corner" />
        </>
      )}

      {/* Cursor crosshair on rulers */}
      {showRulers && pixelColor && !dragging && !ctxMenu && (
        <>
          <div
            className="pixel-ruler-cursor-h"
            style={{ left: cursorPos.x }}
          />
          <div
            className="pixel-ruler-cursor-v"
            style={{ top: cursorPos.y }}
          />
        </>
      )}

      {/* Zoom badge */}
      {scale !== 1 && (
        <span
          className="zoom-badge"
          style={showRulers ? { bottom: RULER_SIZE + 4 } : undefined}
        >
          {Math.round(scale * 100)}%
        </span>
      )}

      {/* Colour picker tooltip — hidden when context panel is open */}
      {pixelColor && !dragging && !ctxMenu && (
        <div
          className="color-picker-tooltip"
          style={{
            left: cursorPos.x + 16,
            top: cursorPos.y + 16,
          }}
        >
          <span
            className="color-picker-swatch"
            style={{ background: pixelColor.hex }}
          />
          <span className="color-picker-value">
            {pixelColor.hex.toUpperCase()}
          </span>
          <span className="color-picker-rgba">
            {pixelColor.r}, {pixelColor.g}, {pixelColor.b}
            {pixelColor.a < 255 ? `, ${pixelColor.a}` : ''}
          </span>
          <span className="color-picker-coords">
            [{pixelColor.x}, {pixelColor.y}]
          </span>
        </div>
      )}

    </div>
    {/* Context panel — portalled to body so it's always on top */}
    {ctxMenu && createPortal(
      <div
        className="image-context-panel"
        style={{ left: ctxMenu.x, top: ctxMenu.y }}
      >
        {ctxMenuItems.map((item, i) => {
          if ('separator' in item && item.separator) {
            return <div key={i} className="context-menu-separator" />;
          }
          const mi = item as { label: string; action: () => void; disabled?: boolean };
          return (
            <button
              key={i}
              className="context-menu-item"
              disabled={mi.disabled}
              onClick={() => {
                mi.action();
                setCtxMenu(null);
              }}
            >
              {mi.label}
            </button>
          );
        })}
      </div>,
      document.body,
    )}
    </>
  );
});
