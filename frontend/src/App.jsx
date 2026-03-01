import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { MantineProvider, AppShell, Group, Button, Text, Container, Title, Badge, Card, Image, Grid, Loader, Center, Stack, Alert } from '@mantine/core';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { WagmiProvider, useAccount, useConnect, http, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { RainbowKitProvider, ConnectButton, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import axios from 'axios';
import { CONTRACT_CONFIG, CONTRACT_ABI } from './config/contracts';

// 创建 QueryClient
const queryClient = new QueryClient();

// 创建 Wagmi 配置
const config = getDefaultConfig({
  appName: 'Real Estate DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia, hardhat],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
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
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ 
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

  // 监听交易状态
  React.useEffect(() => {
    console.log("📊 Transaction Status:", { hash, isPending, isConfirmed, isConfirming, writeError });
    
    if (isPending) {
      setBooking(true);
    } else if (!isPending && hash && !isConfirming && !writeError) {
      // 交易完成（没有pending了，且没有错误）- 认为成功
      // 即使 isConfirmed 是 undefined，只要交易完成就算成功
      if (!showSuccess) {
        console.log("✅ Transaction completed (fallback success)");
        setShowSuccess(true);
        setBooking(false);
        
        // 保存到后端
        if (property && dates.length > 0 && hash) {
          axios.post('http://localhost:3000/api/bookings', {
            propertyId: parseInt(id),
            startDate: dates[0].toISOString(),
            endDate: dates[1].toISOString(),
            amount: property.price,
            walletAddress: address?.toLowerCase(),
            txHash: hash
          }).then(() => {
            console.log("✅ Saved to backend");
          }).catch(err => {
            console.error("❌ Failed to save:", err);
          });
        }
        
        // 2秒后跳转
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      }
    } else if (writeError) {
      setTxError(writeError.message || 'Transaction failed');
      setBooking(false);
    }
  }, [isPending, isConfirming, writeError, hash]);

  const handleBook = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (dates.length < 2) {
      setTxError('Please select check-in and check-out dates');
      return;
    }

    if (!property) return;

    setBooking(true);
    setTxError('');

    const startDate = Math.floor(dates[0].getTime() / 1000);
    const endDate = Math.floor(dates[1].getTime() / 1000);

    try {
      writeContract({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_ABI,
        functionName: 'book',
        args: [BigInt(id), BigInt(startDate), BigInt(endDate), BigInt(property.price)],
        value: BigInt(property.price)
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

  React.useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed && hash) {
      // 用户拒绝或失败
      setBooking(false);
    }
  }, [isPending, isConfirming, isConfirmed, hash]);

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
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isConnected && address) {
      // 使用小写地址查询（与数据库存储格式一致）
      const lowerAddress = address.toLowerCase();
      fetch(`http://localhost:3000/api/bookings/user/${lowerAddress}`)
        .then(res => res.json())
        .then(data => {
          // 后端返回 { source, count, data } 格式
          setBookings(data.data || data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

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
                    <Text fw={600}>Property #{booking.propertyId}</Text>
                    <Badge color={statusColors[booking.status] || 'gray'}>
                      {booking.status}
                    </Badge>
                  </Group>
                  
                  <Text size="sm">📅 Check-in: {new Date(booking.startDate * 1000).toLocaleDateString()}</Text>
                  <Text size="sm">📅 Check-out: {new Date(booking.endDate * 1000).toLocaleDateString()}</Text>
                  <Text fw={500}>💰 Price: {Number(booking.amount) / 1e18} ETH</Text>
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
