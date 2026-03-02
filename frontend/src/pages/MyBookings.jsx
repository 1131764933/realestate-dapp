import React, { useState, useEffect } from 'react';
import { Container, Title, Card, Text, Badge, Button, Group, Stack, Loader, Center, Grid, Alert, Anchor } from '@mantine/core';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { CONTRACT_CONFIG, CONTRACT_ABI } from '../config/contracts';

// Etherscan 测试网链接
const ETHERSCAN_BASE_URL = 'https://sepolia.etherscan.io';

const statusColors = {
    PENDING: 'yellow',
    SUCCESS: 'green',
    FAILED: 'red',
    CANCELLED: 'gray',
    COMPLETED: 'blue'
};

const MyBookings = () => {
    const { address: account, isConnected } = useAccount();
    const location = useLocation();
    const { writeContract, data: hash, isPending: isWriting, isError: isWriteError, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
        hash: hash 
    });
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (account) {
            const loadBookings = async () => {
                try {
                    await axios.post('http://localhost:3000/api/bookings/sync-from-chain');
                } catch (err) {
                    console.error('Sync error:', err);
                }
                fetchBookings();
            };
            loadBookings();
        }
    }, [account, location.state?.refresh]);

    // 监听交易确认
    useEffect(() => {
        if (isConfirmed && hash) {
            console.log('Transaction confirmed:', hash);
            setSuccess('Booking cancelled successfully!');
            axios.post('http://localhost:3000/api/bookings/sync-from-chain').then(() => {
                fetchBookings();
            });
            setProcessing(null);
            setTimeout(() => setSuccess(''), 3000);
        }
    }, [isConfirmed, hash]);

    // 监听写入错误
    useEffect(() => {
        if (isWriteError && writeError) {
            console.error('Write error:', writeError);
            let errorMsg = writeError.message || 'Failed to cancel booking';
            if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
                errorMsg = 'You rejected the transaction';
            }
            setError(errorMsg);
            setProcessing(null);
        }
    }, [isWriteError, writeError]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/bookings/sync-from-chain');
            await fetchBookings();
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/bookings/user/${account}`);
            const bookingsData = response.data?.data || response.data || [];
            setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }
        
        setProcessing(bookingId);
        setError('');
        setSuccess('');
        
        console.log('Cancelling booking:', bookingId);
        
        // 使用 wagmi 发送交易
        writeContract({
            address: CONTRACT_CONFIG.address,
            abi: CONTRACT_ABI,
            functionName: 'cancelBooking',
            args: [BigInt(bookingId)],
        });
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
            <Group justify="space-between" mb="xl">
                <Title order={1}>My Bookings</Title>
                <Button variant="light" onClick={handleRefresh} loading={loading}>
                    🔄 刷新
                </Button>
            </Group>
            
            {error && (
                <Alert color="red" mb="md" onClose={() => setError('')} withCloseButton>
                    <Text>{error}</Text>
                </Alert>
            )}
            
            {success && (
                <Alert color="green" mb="md" onClose={() => setSuccess('')} withCloseButton>
                    <Text>{success}</Text>
                </Alert>
            )}
            
            {(!Array.isArray(bookings) || bookings.length === 0) ? (
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
                                        <Anchor 
                                            href={`${ETHERSCAN_BASE_URL}/tx/${booking.txHash}`} 
                                            target="_blank" 
                                            size="xs" 
                                            c="blue"
                                        >
                                            📋 View Transaction on Etherscan
                                        </Anchor>
                                    )}

                                    {booking.nftTokenId && (
                                        <Alert color={booking.status === 'CANCELLED' ? 'gray' : 'green'} variant="light" mt="sm">
                                            <Text size="sm" fw={600}>🎉 NFT 已铸造!</Text>
                                            <Text size="xs" c="dimmed" mt={5}>
                                                Token ID: {booking.nftTokenId}
                                            </Text>
                                            <Text size="xs" c="dimmed" mt={5}>
                                                NFT 状态: <Badge size="xs" color={booking.status === 'CANCELLED' ? 'gray' : 'green'}>{booking.status}</Badge>
                                            </Text>
                                            <Anchor 
                                                href={`${ETHERSCAN_BASE_URL}/nft/${CONTRACT_CONFIG.address}/${booking.nftTokenId}`}
                                                target="_blank"
                                                size="xs"
                                                c="blue"
                                                mt={5}
                                                style={{ display: 'block' }}
                                            >
                                                🔗 View NFT on Etherscan
                                            </Anchor>
                                        </Alert>
                                    )}

                                    <Group mt="md">
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
