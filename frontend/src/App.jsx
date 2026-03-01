import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { MantineProvider, AppShell, Group, Button, Text, Container, Title, Badge, Card, Image, Grid, Loader, Center, Stack, Alert } from '@mantine/core';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { WagmiProvider, useAccount, useConnect, http, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { RainbowKitProvider, ConnectButton, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import axios from 'axios';
import { CONTRACT_CONFIG, CONTRACT_ABI } from './config/contracts';

// Hardhat chain ID
const HARDHAT_CHAIN_ID = hardhat.id;

// 创建 QueryClient
const queryClient = new QueryClient();

// 创建 Wagmi 配置 - 使用不会CORS的RPC
const config = getDefaultConfig({
  appName: 'Real Estate DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia, hardhat],
  transports: {
    [mainnet.id]: http('https://rpc.ankr.com/eth'),  // 替换默认的 eth.merkle.io
    [sepolia.id]: http('https://rpc.ankr.com/eth'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

// 简单的首页组件
const Home = () => {
  const [properties, setProperties] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch('http://localhost:3000/api/properties')
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Center h="60vh"><Loader size="lg" /></Center>;
  }

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">🏠 Real Estate Listings</Title>
      
      <Grid>
        {properties.map((property) => (
          <Grid.Col key={property.propertyId} span={{ base: 12, sm: 6, md: 4 }}>
            <Card shadow="md" padding="lg" radius="md" withBorder>
              <Card.Section>
                <Image src={property.imageUrl} height={180} alt={property.name} />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={600} size="lg">{property.name}</Text>
                <Badge color={property.isActive ? 'green' : 'red'}>
                  {property.isActive ? 'Available' : 'Unavailable'}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="xs">📍 {property.location}</Text>
              <Text size="sm" lineClamp={2} mb="md">{property.description}</Text>

              <Group justify="space-between" align="center">
                <Text fw={700} size="xl" c="blue">
                  {Number(property.price) / 1e18} ETH
                </Text>
                <Button onClick={() => navigate(`/property/${property.propertyId}`)}>
                  View Details
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
};

// 房源详情组件
const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ 
    hash: hash,
    query: {
      enabled: !!hash,
    }
  });
  
  const [property, setProperty] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [booking, setBooking] = React.useState(false);
  const [dates, setDates] = React.useState([]);
  const [txError, setTxError] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    fetch(`http://localhost:3000/api/properties/${id}`)
      .then(res => res.json())
      .then(data => {
        setProperty(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // 监听交易状态 - 必须等交易成功才保存到数据库
  React.useEffect(() => {
    console.log("📊 Transaction Status:", { hash, isPending, isConfirming, isSuccess, isError, writeError });
    
    // 1. 交易被拒绝或有错误
    if (writeError) {
      setTxError(writeError.message || 'Transaction failed');
      setBooking(false);
      return;
    }

    // 2. 交易确认成功 - 不再提前写入 MongoDB，让 Indexer 或 My Bookings 页面从链上同步
    if (isSuccess && hash) {
      console.log("✅ Transaction confirmed successfully!");
      console.log("📋 Booking will be synced by Indexer. Redirecting to My Bookings...");
      
      if (!showSuccess) {
        setShowSuccess(true);
        setBooking(false);
        
        // 不再提前写入 MongoDB！直接跳转
        // My Bookings 页面会从链上同步数据
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      }
      return;
    }

    // 3. 交易失败
    if (isError) {
      setTxError('Transaction failed on blockchain');
      setBooking(false);
      return;
    }

    // 4. 交易 pending 中
    if (isPending || isConfirming) {
      setBooking(true);
    }
  }, [isPending, isConfirming, isSuccess, isError, writeError, hash]);

  const handleBook = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    // 检查是否连接到正确的网络
    if (chainId !== HARDHAT_CHAIN_ID) {
      setTxError(`Please switch to Hardhat network (chainId: ${HARDHAT_CHAIN_ID}) before booking. Current chainId: ${chainId}`);
      return;
    }

    if (dates.length < 2) {
      setTxError('Please select check-in and check-out dates');
      return;
    }

    if (!property) return;

    // 检查日期是否是未来日期（至少1小时后）
    const now = Math.floor(Date.now() / 1000);
    const startDate = Math.floor(dates[0].getTime() / 1000);
    const endDate = Math.floor(dates[1].getTime() / 1000);
    
    if (startDate <= now + 3600) { // 至少1小时后
      setTxError('Check-in date must be at least 1 hour in the future. Please select a later date.');
      return;
    }
    
    if (endDate <= startDate) {
      setTxError('Check-out date must be after check-in date');
      return;
    }

    setBooking(true);
    setTxError('');

    try {
      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_ABI,
        functionName: 'book',
        args: [BigInt(id), BigInt(startDate), BigInt(endDate), BigInt(property.price)],
        value: BigInt(property.price),
        gas: 300000n
      });
    } catch (err) {
      console.error(err);
      setTxError(err.message || 'Booking failed');
      setBooking(false);
    }
  };

  // 处理交易状态
  React.useEffect(() => {
    if (writeError) {
      setTxError(writeError.message || 'Transaction failed');
      setBooking(false);
    }
  }, [writeError]);

  if (loading) return <Center h="60vh"><Loader size="lg" /></Center>;
  if (!property) return <Container><Text>Property not found</Text></Container>;

  return (
    <Container size="xl" py="xl">
      <Button variant="subtle" mb="md" onClick={() => navigate('/')}>
        ← Back to Listings
      </Button>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card shadow="md" padding="lg" radius="md">
            <Image src={property.imageUrl} radius="md" alt={property.name} />
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            <Group>
              <Title order={1}>{property.name}</Title>
              <Badge color={property.isActive ? 'green' : 'red'} size="lg">
                {property.isActive ? 'Available' : 'Unavailable'}
              </Badge>
            </Group>

            <Text size="lg" c="dimmed">📍 {property.location}</Text>
            <Text>{property.description}</Text>
            
            <Text fw={700} size="xl" c="blue">
              {Number(property.price) / 1e18} ETH
            </Text>

            {txError && <Alert color="red" mb="md">{txError}</Alert>}

            {showSuccess ? (
              <Alert color="green" title="🎉 Booking Successful!">
                Your booking has been confirmed on the blockchain!<br/>
                <Text size="sm" mt="xs">Redirecting to My Bookings...</Text>
              </Alert>
            ) : (
              <>
                <input
                  type="date"
                  onChange={(e) => {
                    const start = new Date(e.target.value);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 1);
                    setDates([start, end]);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                />

                <Button 
                  size="lg" 
                  fullWidth 
                  onClick={handleBook}
                  loading={booking}
                  disabled={!property.isActive}
                >
                  {isPending ? 'Waiting for confirmation...' : isConfirming ? 'Confirming...' : isConnected ? 'Book Now' : 'Connect Wallet to Book'}
                </Button>
              </>
            )}

            {isConnected && (
              <Text size="sm" c="dimmed">
                Connected: {address?.substring(0, 6)}...{address?.substring(38)}
              </Text>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

// 我的预订组件
const MyBookings = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ 
    hash: hash,
    query: { enabled: !!hash }
  });
  
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [cancellingId, setCancellingId] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0); // 用于强制刷新

  // 只从数据库读取 - 不查区块链
  const fetchBookings = async () => {
    if (isConnected && address) {
      const lowerAddress = address.toLowerCase();
      // 添加时间戳强制刷新，避免缓存
      const url = `http://localhost:3000/api/bookings/user/${lowerAddress}?_t=${Date.now()}`;
      fetch(url)
        .then(res => res.json())
        .then(async data => {
          const bookingsData = data.data || data;
          
          // 直接使用数据库返回的数据（后端 Indexer 是单一数据源）
          setBookings(bookingsData);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBookings();
  }, [isConnected, address, refreshKey]);

  // 监听取消交易状态 - 必须等交易确认成功才更新数据库
  React.useEffect(() => {
    console.log("📊 Cancel tx status:", { hash, isPending, isConfirming, isSuccess, isError, cancellingId });
    
    // 1. 交易失败或有错误
    if (isError || writeError) {
      console.error("❌ Cancel transaction failed");
      setCancellingId(null);
      return;
    }

    // 2. 交易确认成功 - 更新数据库并重置状态
    if (isSuccess && cancellingId) {
      console.log("✅ Cancel transaction confirmed, updating database...");
      
      // 先重置状态，避免UI卡住
      const bookingIdToCancel = cancellingId;
      setCancellingId(null);
      
      // 强制刷新标记
      setRefreshKey(k => k + 1);
      
      // 调用后端 API 更新数据库状态
      fetch(`http://localhost:3000/api/bookings/${bookingIdToCancel}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address?.toLowerCase() })
      })
      .then(res => res.json())
      .then(data => {
        console.log("✅ Database updated:", data);
        // 延迟一点刷新，确保数据库已更新
        setTimeout(() => fetchBookings(), 500);
      })
      .catch(err => {
        console.error("❌ Failed to update database:", err);
        fetchBookings(); // 即使失败也刷新
      });
      
      return;
    }

    // 3. 交易 pending 中
    if (isPending || isConfirming) {
      // 等待确认
    }
  }, [isPending, isConfirming, isSuccess, isError, writeError, hash, cancellingId, address, fetchBookings]);

  const handleCancel = async (bookingId, bookingOwner) => {
    if (!isConnected) {
      alert('Please connect wallet first');
      return;
    }

    // 检查是否连接到正确的网络
    if (chainId !== HARDHAT_CHAIN_ID) {
      alert(`Please switch to Hardhat network (chainId: ${HARDHAT_CHAIN_ID}) before cancelling. Current chainId: ${chainId}`);
      return;
    }

    // 检查当前钱包是否是 owner
    if (bookingOwner && bookingOwner.toLowerCase() !== address?.toLowerCase()) {
      alert(`You are not the owner of this booking.\n\nOwner: ${bookingOwner}\nYour address: ${address}`);
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setCancellingId(bookingId);
    
    try {
      console.log("📤 Cancelling booking:", bookingId);
      
      // 直接调用合约取消 - 设置合理的 gas 限制
      await writeContractAsync({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_ABI,
        functionName: 'cancelBooking',
        args: [BigInt(bookingId)],
        gas: 200000n
      });
      
      console.log("✅ Cancel transaction submitted");
      
    } catch (err) {
      console.error("❌ Cancel error:", err);
      
      const errorMsg = err.message || '';
      
      // 用户拒绝
      if (errorMsg.includes('User rejected') || errorMsg.includes('rejected the request')) {
        console.log("👤 User rejected the transaction");
        alert("Transaction was rejected by user");
      }
      // 合约 revert - 不是 owner
      else if (errorMsg.includes('Not booking owner')) {
        console.log("❌ Not the owner of this booking");
        alert("Error: You are not the owner of this booking");
      }
      // 合约 revert - 不能取消
      else if (errorMsg.includes('Cannot cancel')) {
        console.log("❌ Cannot cancel this booking");
        alert("Error: This booking cannot be cancelled");
      }
      // 其他错误
      else {
        alert("Error: " + errorMsg.substring(0, 100));
      }
      
      setCancellingId(null);
    }
  };

  const statusColors = {
    PENDING: 'yellow',
    SUCCESS: 'green',
    FAILED: 'red',
    CANCELLED: 'gray',
    COMPLETED: 'blue'
  };

  if (!isConnected) {
    return (
      <Container size="xl" py="xl">
        <Title order={1} mb="xl">📋 My Bookings</Title>
        <Alert color="blue">Please connect your wallet to view your bookings.</Alert>
      </Container>
    );
  }

  if (loading) return <Center h="60vh"><Loader size="lg" /></Center>;

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">📋 My Bookings</Title>

      {bookings.length === 0 ? (
        <Text c="dimmed">No bookings yet. Go find your dream property!</Text>
      ) : (
        <Grid>
          {bookings.map((booking) => (
            <Grid.Col key={booking._id || booking.bookingId} span={{ base: 12, md: 6 }}>
              <Card shadow="md" padding="lg" radius="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600}>🏠 Property #{booking.propertyId} (ID: {booking.bookingId})</Text>
                    <Badge color={statusColors[booking.status] || 'gray'}>
                      {booking.status}
                    </Badge>
                  </Group>
                  
                  <Text size="sm">📅 Check-in: {new Date(booking.startDate * 1000).toLocaleDateString()}</Text>
                  <Text size="sm">📅 Check-out: {new Date(booking.endDate * 1000).toLocaleDateString()}</Text>
                  <Text fw={500}>💰 Price: {Number(booking.amount) / 1e18} ETH</Text>
                  <Text size="xs" c="dimmed">Owner: {booking.walletAddress}</Text>
                  
                  {/* 只对 PENDING/CONFIRMED 状态显示取消按钮 */}
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <Button 
                      color="red" 
                      variant="outline" 
                      size="sm"
                      loading={cancellingId === booking.bookingId}
                      onClick={() => handleCancel(booking.bookingId, booking.walletAddress)}
                      disabled={cancellingId !== null}
                    >
                      {cancellingId === booking.bookingId ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Container>
  );
};

// Header 组件
const Header = () => {
  const navigate = useNavigate();
  
  return (
    <AppShell.Header>
      <Group h="100%" px="xl" justify="space-between">
        <Text 
          fw={700} 
          size="xl" 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          🏠 RealEstate DApp
        </Text>

        <Group>
          <Button variant="subtle" onClick={() => navigate('/')}>
            Properties
          </Button>
          <Button variant="subtle" onClick={() => navigate('/my-bookings')}>
            My Bookings
          </Button>
          <ConnectButton />
        </Group>
      </Group>
    </AppShell.Header>
  );
};

// 主 App
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <MantineProvider>
            <BrowserRouter>
              <AppShell header={{ height: 60 }}>
                <Header />
                <AppShell.Main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/property/:id" element={<PropertyDetail />} />
                    <Route path="/my-bookings" element={<MyBookings />} />
                  </Routes>
                </AppShell.Main>
              </AppShell>
            </BrowserRouter>
          </MantineProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
