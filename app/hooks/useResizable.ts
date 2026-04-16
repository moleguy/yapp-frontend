import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableProps {
  initialWidth: number;
  minWidth: number;
  maxWidth?: number;
  direction: 'left' | 'right';
  isCollapsible?: boolean;
  collapseThreshold?: number;
}

export const useResizable = ({
  initialWidth,
  minWidth,
  maxWidth = 800,
  direction,
  isCollapsible = false,
  collapseThreshold = 150,
}: UseResizableProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastWidthRef = useRef(initialWidth);

  const startResizing = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      let newWidth: number;
      if (direction === 'left') {
        newWidth = e.clientX - 4; // Subtracting the small margin/padding if necessary
      } else {
        newWidth = window.innerWidth - e.clientX - 4;
      }

      if (isCollapsible && newWidth < collapseThreshold) {
        setIsCollapsed(true);
        setWidth(0);
      } else {
        setIsCollapsed(false);
        const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        setWidth(constrainedWidth);
        lastWidthRef.current = constrainedWidth;
      }
    },
    [isResizing, direction, minWidth, maxWidth, isCollapsible, collapseThreshold]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, resize, stopResizing]);

  const toggleCollapse = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setWidth(lastWidthRef.current);
    } else {
      setIsCollapsed(true);
      setWidth(0);
    }
  }, [isCollapsed]);

  return { width, isResizing, startResizing, isCollapsed, toggleCollapse, setWidth };
};
