import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Card, Image, Text, Button, Title, Loader, Center, Badge, Group, Stack, Alert } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { ethers } from 'ethers';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { CONTRACT_CONFIG, CONTRACT_ABI, BOOKING_STATUS } from '../config/contracts';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { address: account, isConnected } = useAccount();
    
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState(null);
    const [booking, setBooking] = useState(false);
    const [txStatus, setTxStatus] = useState('idle'); // idle, pending, success, failed
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/api/properties/${id}`);
            setProperty(response.data);
        } catch (error) {
            console.error('Failed to fetch property:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async () => {
        if (!account) {
            // 提示用户连接钱包
            alert('Please connect your wallet first');
            return;
        }

        if (!dateRange || dateRange.length < 2) {
            setErrorMessage('Please select date range');
            return;
        }

        try {
            setBooking(true);
            setTxStatus('pending');
            setErrorMessage('');
            
            // 直接使用 window.ethereum 获取 signer
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            const signer = await ethersProvider.getSigner();
            
            const contract = new ethers.Contract(
                CONTRACT_CONFIG.address,
                CONTRACT_ABI,
                signer
            );

            const startDate = Math.floor(dateRange[0].getTime() / 1000);
            const endDate = Math.floor(dateRange[1].getTime() / 1000);
            const amount = property.price;

            // 调用合约预订
            const tx = await contract.book(id, startDate, endDate, amount, {
                value: amount
            });

            await tx.wait();

            // 保存到后端
            await axios.post('http://localhost:3000/api/bookings', {
                propertyId: parseInt(id),
                startDate: dateRange[0].toISOString(),
                endDate: dateRange[1].toISOString(),
                amount: amount.toString(),
                walletAddress: account,
                txHash: tx.hash
            });

            setTxStatus('success');
            setTimeout(() => {
                navigate('/my-bookings', { state: { refresh: true } });
            }, 2000);
        } catch (error) {
            console.error('Booking failed:', error);
            setTxStatus('failed');
            setErrorMessage(error.message || 'Booking failed');
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    if (!property) {
        return <Container py="xl">Property not found</Container>;
    }

    return (
        <Container size="xl" py="xl">
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="lg" radius="md">
                        <Image
                            src={property.imageUrl || 'https://placehold.co/600x400'}
                            radius="md"
                            alt={property.name}
                        />
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

                        {txStatus === 'success' ? (
                            <Alert color="green" title="Success!">
                                Booking successful! Redirecting to My Bookings...
                            </Alert>
                        ) : (
                            <>
                                <DatePickerInput
                                    type="range"
                                    label="Select dates"
                                    placeholder="Check-in to Check-out"
                                    value={dateRange}
                                    onChange={setDateRange}
                                    minDate={new Date()}
                                    disabled={!property.isActive}
                                />

                                {errorMessage && (
                                    <Alert color="red" title="Error">
                                        {errorMessage}
                                    </Alert>
                                )}

                                <Button 
                                    size="lg" 
                                    fullWidth 
                                    onClick={handleBook}
                                    loading={booking}
                                    disabled={!property.isActive || booking}
                                >
                                    {account ? 'Book Now' : 'Connect Wallet to Book'}
                                </Button>
                            </>
                        )}

                        {account && (
                            <Text size="sm" c="dimmed">
                                Connected: {account.substring(0, 6)}...{account.substring(38)}
                            </Text>
                        )}
                    </Stack>
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default PropertyDetail;
