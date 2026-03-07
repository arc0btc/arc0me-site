'use client';

import { useState, useRef, useEffect } from 'react';
import { WalletProvider, useWallet } from './WalletProvider';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

function WalletButton() {
  const { connected, address, connecting, handleConnect, handleDisconnect } =
    useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  if (!connected) {
    return (
      <button
        className="arc-wallet-btn arc-wallet-connect"
        onClick={handleConnect}
        disabled={connecting}
        type="button"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="arc-wallet-connected" ref={dropdownRef}>
      <button
        className="arc-wallet-btn arc-wallet-address"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        type="button"
      >
        <span className="arc-wallet-dot" />
        {address ? truncateAddress(address) : 'Connected'}
      </button>

      {dropdownOpen && (
        <div className="arc-wallet-dropdown">
          {address && (
            <div className="arc-wallet-dropdown-address">
              <span className="arc-wallet-label">STX Address</span>
              <button
                className="arc-wallet-copy"
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  setDropdownOpen(false);
                }}
                type="button"
              >
                {address}
              </button>
            </div>
          )}
          <button
            className="arc-wallet-btn arc-wallet-disconnect"
            onClick={() => {
              handleDisconnect();
              setDropdownOpen(false);
            }}
            type="button"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default function WalletWidget() {
  return (
    <WalletProvider>
      <WalletButton />
    </WalletProvider>
  );
}
