import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            setIsConnecting(true);
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            const { ethers } = await import('ethers');
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const network = await newProvider.getNetwork();
            
            setAccount(accounts[0]);
            setProvider(newProvider);
            setChainId(Number(network.chainId));
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setChainId(null);
    };

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                setAccount(accounts[0] || null);
            });
            
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }
    }, []);

    return (
        <WalletContext.Provider value={{ 
            account, 
            provider, 
            chainId, 
            isConnecting, 
            connectWallet, 
            disconnectWallet 
        }}>
            {children}
        </WalletContext.Provider>
    );
};
