import React, { useState, useEffect } from 'react';
import { Container, Title, Card, Text, Badge, Button, Group, Stack, Loader, Center, Grid, Alert } from '@mantine/core';
import { useWallet } from '../context/WalletContext';
import axios from 'axios';
import { CONTRACT_CONFIG } from '../config/contracts';

const statusColors = {
    PENDING: 'yellow',
    SUCCESS: 'green',
    FAILED: 'red',
    CANCELLED: 'gray',
    COMPLETED: 'blue'
};

const MyBookings = () => {
    const { account } = useWallet();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (account) {
            fetchBookings();
        }
    }, [account]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/bookings/user/${account}`);
            setBookings(response.data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        try {
            setProcessing(bookingId);
            setError('');
            
            await axios.post(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
                walletAddress: account
            });
            
            fetchBookings();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleMintNFT = async (bookingId) => {
        try {
            setProcessing(bookingId);
            setError('');
            
            await axios.post(`http://localhost:3000/api/bookings/${bookingId}/mint-nft`, {
                walletAddress: account
            });
            
            alert('NFT minted successfully!');
            fetchBookings();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setProcessing(null);
        }
    };

    if (!account) {
        return (
            <Container py="xl">
                <Title order={1}>My Bookings</Title>
                <Text c="dimmed" mt="md">Please connect your wallet to view bookings</Text>
            </Container>
        );
    }

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">My Bookings</Title>
            
            {error && (
                <Alert color="red" mb="md" onClose={() => setError('')} withCloseButton>
                    {error}
                </Alert>
            )}
            
            {bookings.length === 0 ? (
                <Text c="dimmed">No bookings yet. Go find your dream property!</Text>
            ) : (
                <Grid>
                    {bookings.map((booking) => (
                        <Grid.Col key={booking._id || booking.bookingId} span={{ base: 12, md: 6 }}>
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text fw={500}>Property #{booking.propertyId}</Text>
                                        <Badge color={statusColors[booking.status] || 'gray'}>
                                            {booking.status}
                                        </Badge>
                                    </Group>
                                    
                                    <Text size="sm">
                                        📅 Check-in: {new Date(booking.startDate * 1000).toLocaleDateString()}
                                    </Text>
                                    <Text size="sm">
                                        📅 Check-out: {new Date(booking.endDate * 1000).toLocaleDateString()}
                                    </Text>
                                    
                                    <Text size="sm" fw={500}>
                                        💰 Price: {Number(booking.amount) / 1e18} ETH
                                    </Text>
                                    
                                    {booking.txHash && (
                                        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                                            TX: {booking.txHash.substring(0, 20)}...
                                        </Text>
                                    )}

                                    {/* NFT 信息展示 */}
                                    {booking.nftTokenId && (
                                        <Alert color="green" variant="light" mt="sm">
                                            <Text size="sm" fw={600}>🎉 NFT 已铸造!</Text>
                                            <Text size="xs" c="dimmed" mt={5}>
                                                Token ID: {booking.nftTokenId}
                                            </Text>
                                            <Text 
                                                size="xs" 
                                                c="blue" 
                                                style={{ cursor: 'pointer' }} 
                                                mt={5}
                                                onClick={() => window.open(`https://testnets.opensea.io/assets/localhost/${CONTRACT_CONFIG.address}/${booking.nftTokenId}`, '_blank')}
                                            >
                                                📎 在 OpenSea 查看
                                            </Text>
                                        </Alert>
                                    )}

                                    <Group mt="md">
                                        {/* 允许 PENDING 和 SUCCESS 状态都可以 Mint NFT */}
                                        {(booking.status === 'PENDING' || booking.status === 'SUCCESS') && !booking.nftTokenId && (
                                            <Button 
                                                size="sm" 
                                                color="green"
                                                onClick={() => handleMintNFT(booking.bookingId)}
                                                loading={processing === booking.bookingId}
                                            >
                                                🎨 Mint NFT
                                            </Button>
                                        )}
                                        
                                        {(booking.status === 'PENDING' || booking.status === 'SUCCESS') && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                color="red"
                                                onClick={() => handleCancel(booking.bookingId)}
                                                loading={processing === booking.bookingId}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    ))}
                </Grid>
            )}
        </Container>
    );
};

export default MyBookings;
