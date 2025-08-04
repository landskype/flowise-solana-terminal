/*
 * LogViewer.tsx
 * Component for displaying API logs and events
 */

import React, { useState, useEffect, useRef } from 'react';
import { TERMINAL_FONT, TERMINAL_GREEN } from '../theme';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'api';
  message: string;
  details?: any;
  agentId?: string;
  agentName?: string;
  endpoint?: string;
  method?: string;
  status?: number;
  duration?: number;
}

interface LogViewerProps {
  logs: LogEntry[];
  isVisible: boolean;
  onToggle: () => void;
  onClearLogs: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  isVisible,
  onToggle,
  onClearLogs,
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: Math.max(0, window.innerWidth - 420),
    y: Math.max(0, window.innerHeight - 220),
  });
  const [size, setSize] = useState({ width: 400, height: 192 });
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === dragRef.current) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - 200; // Half width (400/2)
      const newY = e.clientY - 24; // Half height

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition({
        x: Math.max(0, window.innerWidth - 420),
        y: Math.max(0, window.innerHeight - 220),
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-[#00ff41]';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'api':
        return 'text-blue-400';
      default:
        return 'text-[#00ff41]';
    }
  };

  const getLogTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'api':
        return '🌐';
      default:
        return 'ℹ';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return `(${duration}ms)`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className='fixed bottom-4 right-4 bg-black text-[#00ff41] border border-[#00ff41] px-3 py-2 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors z-50 shadow-lg'
        style={{ position: 'fixed', bottom: '16px', right: '16px' }}
      >
        📋 Logs ({logs.length})
      </button>
    );
  }

  return (
    <div
      className='fixed bg-black border border-[#00ff41] z-50 flex flex-col shadow-lg'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header */}
      <div
        ref={dragRef}
        className='flex items-center justify-between p-2 border-b border-[#00ff41] bg-black cursor-grab'
        onMouseDown={handleMouseDown}
      >
        <h3 className='text-xs text-[#00ff41] font-mono font-bold'>
          API Logs ({logs.length})
        </h3>
        <button
          onClick={onToggle}
          className='text-[#00ff41] hover:text-white text-xs'
        >
          ✕
        </button>
      </div>

      {/* Logs Container */}
      <div className='flex-1 overflow-y-auto p-2 space-y-1'>
        {logs.length === 0 ? (
          <div className='text-xs text-[#00ff41] opacity-50 text-center py-4'>
            No logs yet...
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className='text-xs font-mono border-b border-gray-800 pb-1'
            >
              <div className='flex items-start gap-2'>
                <span
                  className={`${getLogTypeColor(
                    log.type
                  )} font-bold flex-shrink-0`}
                >
                  {getLogTypeIcon(log.type)}
                </span>
                <span className='text-[#00ff41] opacity-70 flex-shrink-0'>
                  {formatTimestamp(log.timestamp)}
                </span>
                <span
                  className={`${getLogTypeColor(
                    log.type
                  )} flex-1 min-w-0 break-words`}
                >
                  {log.message}
                </span>
                {log.duration && (
                  <span className='text-[#00ff41] opacity-50 flex-shrink-0'>
                    {formatDuration(log.duration)}
                  </span>
                )}
              </div>

              {/* API Details */}
              {log.type === 'api' && (
                <div className='ml-4 mt-1 text-xs opacity-70 flex flex-wrap gap-2'>
                  {log.method && (
                    <span className='text-blue-400'>
                      {log.method} {log.status}
                    </span>
                  )}
                  {log.endpoint && (
                    <span className='text-[#00ff41] opacity-70 break-all'>
                      {log.endpoint}
                    </span>
                  )}
                  {log.agentName && (
                    <span className='text-yellow-400'>→ {log.agentName}</span>
                  )}
                </div>
              )}

              {/* Error Details */}
              {log.type === 'error' && log.details && (
                <div className='ml-4 mt-1 text-xs text-red-400 opacity-70'>
                  {typeof log.details === 'string'
                    ? log.details
                    : JSON.stringify(log.details, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className='p-1 border-t border-[#00ff41] bg-black text-xs text-[#00ff41] opacity-70'>
        <div className='flex justify-between items-center'>
          <span>Last: {new Date().toLocaleTimeString()}</span>
          <div className='flex gap-1'>
            <button
              onClick={onClearLogs}
              className='text-[#00ff41] hover:text-white px-1'
              title='Clear logs'
            >
              Clear
            </button>
            <button
              onClick={() =>
                setPosition({
                  x: Math.max(0, window.innerWidth - 420),
                  y: Math.max(0, window.innerHeight - 220),
                })
              }
              className='text-[#00ff41] hover:text-white px-1'
              title='Reset position'
            >
              ⌂
            </button>
            <button
              onClick={onToggle}
              className='text-[#00ff41] hover:text-white px-1'
              title='Minimize'
            >
              −
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
