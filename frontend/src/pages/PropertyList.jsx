import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, Text, Image, Button, Title, Loader, Center, Group, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/properties');
            setProperties(response.data);
        } catch (error) {
            console.error('Failed to fetch properties:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Title order={1} mb="xl">Browse Properties</Title>
            
            <Grid>
                {properties.map((property) => (
                    <Grid.Col key={property.propertyId} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Card.Section>
                                <Image
                                    src={property.imageUrl || 'https://placehold.co/400x300'}
                                    height={200}
                                    alt={property.name}
                                />
                            </Card.Section>

                            <Group justify="space-between" mt="md" mb="xs">
                                <Text fw={500} size="lg">{property.name}</Text>
                                <Badge color={property.isActive ? 'green' : 'red'}>
                                    {property.isActive ? 'Available' : 'Unavailable'}
                                </Badge>
                            </Group>
                            
                            <Text size="sm" c="dimmed" mt="xs">
                                📍 {property.location}
                            </Text>
                            
                            <Text size="sm" mt="xs" lineClamp={2}>
                                {property.description}
                            </Text>
                            
                            <Text fw={700} size="xl" mt="md" c="blue">
                                {Number(property.price) / 1e18} ETH
                            </Text>

                            <Button 
                                fullWidth 
                                mt="md" 
                                onClick={() => navigate(`/property/${property.propertyId}`)}
                                disabled={!property.isActive}
                            >
                                View Details
                            </Button>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
        </Container>
    );
};

export default PropertyList;
