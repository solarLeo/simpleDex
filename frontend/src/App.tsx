import { BrowserRouter, Routes, Route } from 'react-router';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from './config/wagmi';
import Layout from './components/Layout';
import Swap from './pages/Swap';
import Pool from './pages/Pool';
import AddLiquidity from './pages/AddLiquidity';
import RemoveLiquidity from './pages/RemoveLiquidity';
import './App.css';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Swap />} />
                <Route path="pool" element={<Pool />} />
                <Route path="add-liquidity" element={<AddLiquidity />} />
                <Route path="remove-liquidity" element={<RemoveLiquidity />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
