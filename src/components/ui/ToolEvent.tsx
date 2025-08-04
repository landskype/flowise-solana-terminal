import React from 'react';

export interface ToolEvent {
  id: string;
  type: 'calledTools' | 'usedTools';
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
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

  const formatToolOutput = (output: any) => {
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

  return (
    <div className='tool-event bg-terminal-dark border border-terminal-gray rounded p-3 my-2 font-terminal text-sm'>
      <div className='flex items-center gap-2 mb-2'>
        <span className='text-terminal-green'></span>
        <span className='text-terminal-green font-bold'>
          {event.type === 'calledTools' ? 'Tool Called' : 'Tool Used'}
        </span>
        {event.toolName && (
          <>
            <span className='text-gray-400'>•</span>
            <span className='text-blue-400'>
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
          <div className='text-gray-400 text-xs mb-1'>Input:</div>
          <pre className='bg-black p-2 rounded text-xs overflow-x-auto'>
            {JSON.stringify(event.toolInput, null, 2)}
          </pre>
        </div>
      )}

      {event.toolOutput && (
        <div>
          <div className='text-gray-400 text-xs mb-1'>Output:</div>
          <pre className='bg-black p-2 rounded text-xs overflow-x-auto text-green-400'>
            {formatToolOutput(event.toolOutput)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolEvent;
