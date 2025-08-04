/*
 * AgentSelector.tsx
 * Component for fetching and selecting agents from Flowise
 */

import React, { useState, useEffect } from 'react';
import {
  fetchFlowiseAgents,
  validateFlowiseUrl,
  getDefaultFlowiseUrl,
} from '@/shared/lib/flowiseApi';
import { logInfo, logError, logWarning } from '@/shared/lib/logger';
import type { FlowiseAgent } from '@/shared/types/flowise';

// Using FlowiseAgent interface from flowiseApi.ts

interface AgentSelectorProps {
  onAgentSelect: (
    agentId: string,
    agentName: string,
    agentData?: FlowiseAgent
  ) => void;
  currentAgentId?: string;
  apiKey: string;
  setApiKey: (key: string) => void;
  useSSE: boolean;
  setUseSSE: (use: boolean) => void;
  sseSupported: boolean;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  onAgentSelect,
  currentAgentId,
  apiKey,
  setApiKey,
  useSSE,
  setUseSSE,
  sseSupported,
}) => {
  const [agents, setAgents] = useState<FlowiseAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowiseUrl, setFlowiseUrl] = useState(getDefaultFlowiseUrl());

  const fetchAgents = async () => {
    if (!validateFlowiseUrl(flowiseUrl)) {
      const errorMsg = 'Invalid URL format';
      setError(errorMsg);
      logWarning(errorMsg, { url: flowiseUrl });
      return;
    }

    setLoading(true);
    setError(null);
    logInfo('Fetching agents from Flowise', { url: flowiseUrl });

    try {
      const agents = await fetchFlowiseAgents(flowiseUrl, apiKey);
      setAgents(agents);
      logInfo(`Successfully fetched ${agents.length} agents`);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to fetch agents';
      setError(errorMsg);
      logError('Failed to fetch agents', { error: err, url: flowiseUrl });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [flowiseUrl, apiKey]);

  // Автоматически выбираем агента по умолчанию после загрузки
  useEffect(() => {
    if (agents.length > 0 && currentAgentId) {
      const defaultAgent = agents.find((agent) => agent.id === currentAgentId);
      if (defaultAgent) {
        handleAgentSelect(defaultAgent);
      }
    }
  }, [agents, currentAgentId]);

  const handleAgentSelect = (agent: FlowiseAgent) => {
    onAgentSelect(agent.id, agent.name, agent);
  };

  return (
    <div className='w-full bg-black border-b border-[#00ff41] p-2'>
      <div className='flex items-center gap-2 mb-2'>
        <label htmlFor='flowise-url' className='text-xs text-[#00ff41] mr-2'>
          Flowise URL:
        </label>
        <input
          id='flowise-url'
          type='text'
          value={flowiseUrl}
          onChange={(e) => setFlowiseUrl(e.target.value)}
          className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
          placeholder='http://localhost:3000'
          autoComplete='off'
        />
        <label htmlFor='api-key' className='text-xs text-[#00ff41] mr-2'>
          API Key:
        </label>
        <input
          id='api-key'
          type='password'
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
          placeholder='Enter API key'
          autoComplete='off'
        />
        <button
          onClick={fetchAgents}
          disabled={loading}
          className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <div className='flex items-center gap-2'>
          <label className='text-xs text-[#00ff41]'>SSE:</label>
          <input
            type='checkbox'
            checked={useSSE && sseSupported}
            onChange={(e) => setUseSSE(e.target.checked)}
            disabled={!sseSupported}
            className='w-4 h-4 text-[#00ff41] bg-black border border-[#00ff41]'
            title={
              sseSupported
                ? 'Enable streaming responses (experimental)'
                : 'SSE not supported'
            }
          />
          {!sseSupported && (
            <span className='text-xs text-yellow-400'>
              (Using regular API - working)
            </span>
          )}
          {sseSupported && (
            <span className='text-xs text-green-400'>(Streaming enabled)</span>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <label className='text-xs text-[#00ff41] mr-2'>Select Agent:</label>
        <select
          value={currentAgentId || ''}
          onChange={(e) => {
            const agent = agents.find((a) => a.id === e.target.value);
            if (agent) {
              handleAgentSelect(agent);
            }
          }}
          className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
          disabled={loading || agents.length === 0}
        >
          <option value=''>
            {loading ? 'Loading agents...' : 'Choose an agent'}
          </option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className='text-red-400 text-xs mt-1'>Error: {error}</div>}

      {agents.length > 0 && (
        <div className='text-xs text-[#00ff41] mt-1'>
          Found {agents.length} agent(s)
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
