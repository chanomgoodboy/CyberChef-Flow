import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useStegGL } from './useStegGL';

export interface StegCanvasProps {
  src: string;
  mode: number;
  className?: string;
  style?: React.CSSProperties;
  onNaturalSize?: (w: number, h: number) => void;
  onWebGLUnsupported?: () => void;
}

/**
 * Thin canvas wrapper around useStegGL.
 * Exposes the canvas element via forwardRef for parent measurement.
 */
export const StegCanvas = forwardRef<HTMLCanvasElement, StegCanvasProps>(
  function StegCanvas({ src, mode, className, style, onNaturalSize, onWebGLUnsupported }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => canvasRef.current!);

    const { naturalWidth, naturalHeight, webglSupported } = useStegGL(
      canvasRef,
      src,
      mode,
    );

    useEffect(() => {
      if (naturalWidth > 0 && naturalHeight > 0) {
        onNaturalSize?.(naturalWidth, naturalHeight);
      }
    }, [naturalWidth, naturalHeight, onNaturalSize]);

    useEffect(() => {
      if (!webglSupported) {
        onWebGLUnsupported?.();
      }
    }, [webglSupported, onWebGLUnsupported]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={style}
        draggable={false}
      />
    );
  },
);
