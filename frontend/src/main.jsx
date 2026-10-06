import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/scada.css';
// 한/영 사전 — 화면이 그려지기 전에 먼저 읽어 둔다
import './i18n';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
