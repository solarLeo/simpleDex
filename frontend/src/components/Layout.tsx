import { Link, Outlet } from 'react-router';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Simple DEX</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">交换</Link>
            <Link to="/pool" className="nav-link">池子</Link>
            <Link to="/add-liquidity" className="nav-link">添加流动性</Link>
            <Link to="/remove-liquidity" className="nav-link">移除流动性</Link>
          </nav>
          <ConnectButton />
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Simple DEX - 基于恒定乘积公式的 AMM</p>
      </footer>
    </div>
  );
}
