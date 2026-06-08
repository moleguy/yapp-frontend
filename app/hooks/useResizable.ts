import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_PREFIX = 'yapp-resizable:';

type PersistedPanel = { isCollapsed: boolean; width: number };

function readPanel(key: string): PersistedPanel | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPanel;
    if (
      typeof parsed.isCollapsed === 'boolean' &&
      typeof parsed.width === 'number' &&
      Number.isFinite(parsed.width)
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writePanel(key: string, data: PersistedPanel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

interface UseResizableProps {
  initialWidth: number;
  minWidth: number;
  maxWidth?: number;
  direction: 'left' | 'right';
  isCollapsible?: boolean;
  collapseThreshold?: number;
  /** When set, collapsed state and width are restored from localStorage */
  storageKey?: string;
}

export const useResizable = ({
  initialWidth,
  minWidth,
  maxWidth = 800,
  direction,
  isCollapsible = false,
  collapseThreshold = 150,
  storageKey,
}: UseResizableProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastWidthRef = useRef(initialWidth);
  const hydratedRef = useRef(!storageKey);

  useEffect(() => {
    if (!storageKey) return;

    const saved = readPanel(storageKey);
    if (saved) {
      const savedWidth = Math.max(minWidth, Math.min(saved.width, maxWidth));
      lastWidthRef.current = savedWidth;

      if (saved.isCollapsed) {
        setIsCollapsed(true);
        setWidth(0);
      } else {
        setIsCollapsed(false);
        setWidth(savedWidth);
      }
    }

    hydratedRef.current = true;
  }, [storageKey, minWidth, maxWidth]);

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) return;
    writePanel(storageKey, {
      isCollapsed,
      width: isCollapsed ? lastWidthRef.current : width,
    });
  }, [storageKey, isCollapsed, width]);

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
        newWidth = e.clientX - 4;
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
      lastWidthRef.current = width > 0 ? width : lastWidthRef.current;
      setIsCollapsed(true);
      setWidth(0);
    }
  }, [isCollapsed, width]);

  return { width, isResizing, startResizing, isCollapsed, toggleCollapse, setWidth };
};
