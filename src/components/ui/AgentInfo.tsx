/*
 * AgentInfo.tsx
 * Component for displaying information about the selected agent
 */

import React from 'react';
import { TERMINAL_FONT, TERMINAL_GREEN } from '../theme';
import type { FlowiseAgent } from '../../types/flowise';

interface AgentInfoProps {
  agent: FlowiseAgent | null;
  isConnected: boolean;
}

const AgentInfo: React.FC<AgentInfoProps> = ({ agent, isConnected }) => {
  if (!agent) {
    return (
      <div className='w-full bg-black border-b border-[#00ff41] p-2'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-red-400'>No agent selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full bg-black border-b border-[#00ff41] p-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-[#00ff41]'>Agent:</span>
            <span className='text-xs text-[#00ff41] font-mono font-bold'>
              {agent.name}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-xs text-[#00ff41]'>ID:</span>
            <span className='text-xs text-[#00ff41] font-mono opacity-70'>
              {agent.id}
            </span>
          </div>

          {agent.category && (
            <div className='flex items-center gap-2'>
              <span className='text-xs text-[#00ff41]'>Category:</span>
              <span className='text-xs text-[#00ff41] font-mono opacity-70'>
                {agent.category}
              </span>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1'>
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-[#00ff41]' : 'bg-red-400'
              }`}
            />
            <span className='text-xs text-[#00ff41]'>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {agent.deployed !== undefined && (
            <div className='flex items-center gap-1'>
              <span className='text-xs text-[#00ff41]'>Status:</span>
              <span
                className={`text-xs font-mono ${
                  agent.deployed ? 'text-[#00ff41]' : 'text-yellow-400'
                }`}
              >
                {agent.deployed ? 'Deployed' : 'Not Deployed'}
              </span>
            </div>
          )}
        </div>
      </div>

      {agent.description && (
        <div className='mt-1'>
          <span className='text-xs text-[#00ff41] opacity-70'>
            {agent.description}
          </span>
        </div>
      )}
    </div>
  );
};

export default AgentInfo;
