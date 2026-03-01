import React from 'react';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';

function App() {
  return (
    <MantineProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<div>Real Estate DApp - Loading...</div>} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </MantineProvider>
  );
}

export default App;
