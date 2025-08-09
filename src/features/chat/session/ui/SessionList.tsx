import React from 'react';
import type { FC } from 'react';
import type { FlowiseChatSessionSummary } from '@/shared/lib/flowiseApi';

interface SessionListProps {
  sessions: FlowiseChatSessionSummary[];
  onOpen: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

export const SessionList: FC<SessionListProps> = ({
  sessions,
  onOpen,
  onDelete,
}) => {
  return (
    <div className='w-full bg-black border-b border-[#00ff41] p-2'>
      {sessions.length === 0 ? (
        <div className='text-xs text-[#00ff41] opacity-70'>no chats</div>
      ) : (
        <div className='space-y-1'>
          {sessions.map((s) => (
            <div key={s.chatId} className='flex items-center gap-2 text-xs'>
              <button
                className='bg-black text-[#00ff41] border border-[#00ff41] px-2 py-0.5 font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
                onClick={() => onOpen(s.chatId)}
                title='Open chat'
              >
                open
              </button>
              <button
                className='bg-black text-red-400 border border-red-400 px-2 py-0.5 font-mono hover:bg-red-400 hover:text-black transition-colors'
                onClick={() => onDelete(s.chatId)}
                title='Delete chat'
              >
                del
              </button>
              <span className='text-[#00ff41] break-all'>{s.chatId}</span>
              <span className='text-[#00ff41] opacity-60'>
                {s.lastAt ? new Date(s.lastAt).toLocaleString() : ''}
              </span>
              <span className='text-[#00ff41] opacity-60'>({s.count})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
