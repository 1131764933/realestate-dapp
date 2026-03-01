import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@rainbow-me/rainbowkit/styles.css';

import React from 'react';
import { MantineProvider, AppShell, Group, Button, Text, Container, Title, Badge, Card, Image, Grid, Loader, Center, Stack, Alert } from '@mantine/core';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { WagmiProvider, useAccount, useConnect, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { RainbowKitProvider, ConnectButton, darkTheme, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建 QueryClient
const queryClient = new QueryClient();

// 创建 Wagmi 配置
const config = getDefaultConfig({
  appName: 'Real Estate DApp',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
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
  
  const [property, setProperty] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [booking, setBooking] = React.useState(false);
  const [dates, setDates] = React.useState([]);
  const [error, setError] = React.useState('');

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

  const handleBook = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    if (dates.length < 2) {
      setError('Please select check-in and check-out dates');
      return;
    }

    try {
      setBooking(true);
      setError('');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer);

      const startDate = Math.floor(dates[0].getTime() / 1000);
      const endDate = Math.floor(dates[1].getTime() / 1000);

      const tx = await contract.book(id, startDate, endDate, property.price, {
        value: property.price
      });

      await tx.wait();

      await axios.post('http://localhost:3000/api/bookings', {
        propertyId: parseInt(id),
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
        amount: property.price,
        walletAddress: address,
        txHash: tx.hash
      });

      alert('Booking successful!');
      navigate('/my-bookings');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

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

            {error && <Alert color="red">{error}</Alert>}

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
              {isConnected ? 'Book Now' : 'Connect Wallet to Book'}
            </Button>

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
      fetch(`http://localhost:3000/api/bookings/user/${address}`)
        .then(res => res.json())
        .then(data => {
          setBookings(data);
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
