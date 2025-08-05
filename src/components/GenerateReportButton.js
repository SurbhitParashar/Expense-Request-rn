// components/GeneratePDFReportButton.js

import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { generateTripPdf } from '../utils/pdfGenerator';
import * as Sharing from 'expo-sharing';

export default function GeneratePDFReportButton({ tripData, userName, tripName }) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    try {
      setBusy(true);
      const pdfPath = await generateTripPdf(tripData, userName, tripName);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${tripName} Report`,
        });
      } else {
        Alert.alert('PDF Generated', `Saved to:\n${pdfPath}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not generate or share PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#d13a3d',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
      }}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontSize: 16 }}>Generate & Share Report</Text>
      )}
    </TouchableOpacity>
  );
}
