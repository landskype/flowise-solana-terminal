import React from 'react';

export interface ToolEvent {
  id: string;
  type: 'calledTools' | 'usedTools';
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  timestamp: Date;
}

interface ToolEventProps {
  event: ToolEvent;
}

const ToolEvent: React.FC<ToolEventProps> = ({ event }) => {
  const getToolIcon = (toolName: string) => {
    if (toolName.includes('date') || toolName.includes('time')) return '';
    if (toolName.includes('search') || toolName.includes('web')) return '';
    if (toolName.includes('file') || toolName.includes('read')) return '';
    if (toolName.includes('write') || toolName.includes('save')) return '';
    if (toolName.includes('curl') || toolName.includes('http')) return '';
    if (toolName.includes('memory')) return '';
    if (toolName.includes('mcp')) return '';
    return '';
  };

  const formatToolOutput = (output: unknown): string => {
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return output;
      }
    }
    return JSON.stringify(output, null, 2);
  };

  const getToolEventStyle = () => {
    if (event.type === 'calledTools') {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue background
        borderColor: 'rgba(59, 130, 246, 0.3)', // blue border
        borderLeft: '4px solid rgba(59, 130, 246, 0.8)', // blue left border
      };
    } else {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // green background
        borderColor: 'rgba(34, 197, 94, 0.3)', // green border
        borderLeft: '4px solid rgba(34, 197, 94, 0.8)', // green left border
      };
    }
  };

  const getToolEventTextColor = () => {
    if (event.type === 'calledTools') {
      return 'text-blue-300'; // blue text
    } else {
      return 'text-green-300'; // green text
    }
  };

  return (
    <div
      className='tool-event border rounded p-3 my-2 font-terminal text-sm'
      style={getToolEventStyle()}
    >
      <div className='flex items-center gap-2 mb-2'>
        <span className={`${getToolEventTextColor()} font-bold`}>
          {event.type === 'calledTools' ? 'Tool Called' : 'Tool Used'}
        </span>
        {event.toolName && (
          <>
            <span className='text-gray-400'>•</span>
            <span className={`${getToolEventTextColor()} font-mono`}>
              {getToolIcon(event.toolName)} {event.toolName}
            </span>
          </>
        )}
        <span className='text-gray-500 text-xs ml-auto'>
          {event.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {event.toolInput && (
        <div className='mb-2'>
          <div
            className={`${getToolEventTextColor()} text-xs mb-1 font-semibold`}
          >
            Input:
          </div>
          <pre className='bg-black bg-opacity-50 p-2 rounded text-xs overflow-x-auto border border-gray-600'>
            {JSON.stringify(event.toolInput, null, 2)}
          </pre>
        </div>
      )}

      {event.toolOutput && (
        <div>
          <div
            className={`${getToolEventTextColor()} text-xs mb-1 font-semibold`}
          >
            Output:
          </div>
          <pre className='bg-black bg-opacity-50 p-2 rounded text-xs overflow-x-auto border border-gray-600 text-green-300'>
            {formatToolOutput(event.toolOutput)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolEvent;
