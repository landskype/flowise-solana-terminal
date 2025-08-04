import React from 'react';
import './Chat.css';

const GlitchLogo: React.FC = () => (
  <div
    style={{
      fontWeight: 700,
      fontSize: '2.2rem',
      color: '#00ff41',
      textShadow: '0 0 8px #00ff41, 2px 0 #fff, -2px 0 #0f0',
      fontFamily: 'Fira Mono, Consolas, monospace',
    }}
  >
    <span className='glitch-text' data-text='404'>
      404
    </span>
  </div>
);

export default GlitchLogo;
