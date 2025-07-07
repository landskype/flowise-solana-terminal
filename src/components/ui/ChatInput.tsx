import React from 'react';
import { TERMINAL_FONT } from '../theme';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

/**
 * Terminal-style chat input form.
 */
const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
}) => (
  <form
    className='w-full flex items-center gap-2 bg-black border-t-2 border-[#00ff41] px-2 py-4'
    style={{ fontFamily: TERMINAL_FONT, borderRadius: 0 }}
    onSubmit={(e) => {
      e.preventDefault();
      handleSend();
    }}
    autoComplete='off'
  >
    <input
      className='flex-1 bg-black text-[#00ff41] border-2 border-[#00ff41] px-4 py-3 outline-none focus:ring-2 focus:ring-[#00ff41] placeholder-[#00ff41bb] text-lg font-normal always-focus'
      style={{ fontFamily: TERMINAL_FONT, borderRadius: 0 }}
      type='text'
      placeholder='Type your message...'
      value={input}
      onChange={(e) => setInput(e.target.value)}
      disabled={isLoading}
      autoFocus
      tabIndex={0}
    />
    <button
      type='submit'
      className='bg-black border-2 border-[#00ff41] text-[#00ff41] px-4 py-3 font-bold transition-all hover:bg-[#00ff41] hover:text-black active:scale-95'
      style={{ fontFamily: TERMINAL_FONT, borderRadius: 0 }}
      disabled={isLoading || !input.trim()}
      aria-label='Send message'
    >
      ➤
    </button>
  </form>
);

export default ChatInput;
