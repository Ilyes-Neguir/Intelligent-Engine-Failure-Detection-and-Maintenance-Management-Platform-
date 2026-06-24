import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { vehiclesApi } from '../api/vehicles';
import { Colors, Spacing } from '../utils/theme';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useError<string | null>(null);

  // Load vehicles when component mounts
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await vehiclesApi.getAll();
      setVehicles(Array.isArray(data) ? data : [data]);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleAddVehicle = () => {
    navigation.navigate('AddVehicle');
  };

  const handleVehicleSelect = (vehicle: any) => {
    navigation.navigate('VehicleDetails', { vehicleId: vehicle.id.toString() });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: Colors.primary }}>
          My Vehicles
        </Text>
        <Button title="Logout" onPress={handleLogout} color={Colors.error} />
      </View>

      {!user ? (
        <Text style={{ textAlign: 'center', marginTop: 50, color: Colors.textSecondary }}>
          Please log in to continue
        </Text>
      ) : (
        <>
          <Button title="Add New Vehicle" onPress={handleAddVehicle} color={Colors.primary} />

          {loading && (
            <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}

          {error && (
            <Text style={{ color: Colors.error, textAlign: 'center', marginVertical: 10 }}>
              {error}
            </Text>
          )}

          {!loading && vehicles.length === 0 && (
            <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 20 }}>
              No vehicles found. Add your first vehicle to get started.
            </Text>
          )}

          {!loading && vehicles.length > 0 && (
            <FlatList
              data={vehicles}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={{
                  backgroundColor: '#fff',
                  padding: Spacing.md,
                  marginVertical: Spacing.sm,
                  borderRadius: 8,
                  elevation: 2,
                }}>
                  <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                    {item.make} {item.model} ({item.year})
                  </Text>
                  <Text style={{ color: Colors.textSecondary, marginBottom: 2 }}>
                    VIN: {item.vin}
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                    {item.mileage?.toLocaleString()} miles
                  </Text>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </>
      )}
    </View>
  );
};

export default HomeScreen;