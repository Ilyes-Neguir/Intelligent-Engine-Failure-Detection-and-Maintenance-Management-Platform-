import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { vehiclesApi } from '../api/vehicles';
import { Colors, Spacing } from '../utils/theme';

const AddVehicleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    licensePlate: '',
    engineType: '',
    mileage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    // Basic validation
    if (!form.make || !form.model || !form.year || !form.vin) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        vin: form.vin,
        licensePlate: form.licensePlate || undefined,
        engineType: form.engineType || undefined,
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
      };

      await vehiclesApi.post('/vehicles', vehicleData);
      Alert.alert('Success', 'Vehicle added successfully');
      navigation.goBack();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: Spacing.md }}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
    >
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: Spacing.lg, color: Colors.primary }}>
        Add New Vehicle
      </Text>
      
      <TextInput
        placeholder="Make (e.g., Toyota)"
        value={form.make}
        onChangeText={(text) => setForm({ ...form, make: text })}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="Model (e.g., Camry)"
        value={form.model}
        onChangeText={(text) => setForm({ ...form, model: text })}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="Year (e.g., 2020)"
        value={form.year}
        onChangeText={(text) => setForm({ ...form, year: text })}
        keyboardType="number-pad"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="VIN"
        value={form.vin}
        onChangeText={(text) => setForm({ ...form, vin: text })}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="License Plate (optional)"
        value={form.licensePlate}
        onChangeText={(text) => setForm({ ...form, licensePlate: text })}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="Engine Type (optional)"
        value={form.engineType}
        onChangeText={(text) => setForm({ ...form, engineType: text })}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
        }}
      />
      
      <TextInput
        placeholder="Mileage (optional)"
        value={form.mileage}
        onChangeText={(text) => setForm({ ...form, mileage: text })}
        keyboardType="number-pad"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 4,
          padding: Spacing.md,
          marginBottom: Spacing.lg,
        }}
      />
      
      <Button
        title="Save Vehicle"
        onPress={handleSave}
        color={Colors.primary}
        disabled={loading}
      />
      
      {loading && (
        <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      
      {error && (
        <Text style={{ color: Colors.error, textAlign: 'center', marginTop: Spacing.sm }}>
          {error}
        </Text>
      )}
    </ScrollView>
  );
};

export default AddVehicleScreen;
