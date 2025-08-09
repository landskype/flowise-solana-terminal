import React from 'react';
import type { FC } from 'react';

interface SessionControlsProps {
  chatId?: string;
  onNew: () => void;
  onDelete: () => void;
  onToggleList: () => void;
  onRefreshList: () => void;
  onCopyId: () => void;
  chatIdInput: string;
  setChatIdInput: (v: string) => void;
  onLoadChat: () => void;
}

export const SessionControls: FC<SessionControlsProps> = ({
  chatId,
  onNew,
  onDelete,
  onToggleList,
  onRefreshList,
  onCopyId,
  chatIdInput,
  setChatIdInput,
  onLoadChat,
}) => {
  return (
    <div className='w-full bg-black border-b border-[#00ff41] p-2 flex items-center gap-2'>
      <button
        className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
        onClick={onNew}
        title='Start a new chat session'
      >
        new_chat
      </button>
      <button
        className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
        onClick={onDelete}
        disabled={!chatId}
        title='Delete current chat session'
      >
        delete_chat
      </button>
      <button
        className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
        onClick={onToggleList}
        title='Toggle sessions list'
      >
        list_chats
      </button>
      <button
        className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
        onClick={onRefreshList}
        title='Refresh sessions'
      >
        refresh_chats
      </button>
      <input
        type='text'
        value={chatIdInput}
        onChange={(e) => setChatIdInput(e.target.value)}
        placeholder='enter chatId'
        className='flex-1 bg-black text-[#00ff41] border border-[#00ff41] px-2 py-1 text-xs font-mono'
        autoComplete='off'
      />
      <button
        className='bg-black text-[#00ff41] border border-[#00ff41] px-3 py-1 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
        onClick={onLoadChat}
        title='Load chat by id'
      >
        load_chat
      </button>
      <span className='text-xs text-[#00ff41] opacity-70 ml-auto flex items-center gap-2'>
        <span>chatId: {chatId || '—'}</span>
        <button
          className='bg-black text-[#00ff41] border border-[#00ff41] px-2 py-0.5 text-xs font-mono hover:bg-[#00ff41] hover:text-black transition-colors'
          onClick={onCopyId}
          disabled={!chatId}
          title='Copy chatId'
        >
          copy_id
        </button>
      </span>
    </div>
  );
};
