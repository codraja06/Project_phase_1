from pathlib import Path
p=Path('mobile/src/types/navigation.ts');s=p.read_text().replace("ComplaintHistory: { filter?: string }", "ComplaintHistory: { filter?: string; search?: string; days?: number }");p.write_text(s)
p=Path('mobile/src/screens/citizen/ComplaintHistoryScreen.tsx');s=p.read_text().replace("useState('');", "useState(route?.params?.search || '');",1).replace('      fetchComplaints();',"      setSearchQuery(route?.params?.search || '');\n      fetchComplaints();",1).replace('[route?.params?.filter])','[route?.params?.filter, route?.params?.search, route?.params?.days])');s=s.replace('    return complaints.filter((c) => {',"    return complaints.filter((c) => {\n      if (route?.params?.days && Date.parse(c.createdAt) < Date.now() - route.params.days * 86400000) return false;").replace('[complaints, statusFilter, searchQuery]', '[complaints, statusFilter, searchQuery, route?.params?.days]');p.write_text(s)
p=Path('mobile/src/navigation/CitizenNavigator.tsx');s=p.read_text();s=s.replace("import { View, Platform } from 'react-native';", "import { View, Platform } from 'react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';");s=s.replace('  const { isDesktop }', '  const insets = useSafeAreaInsets();\n  const { isDesktop }');s=s.replace("insets={{ top: 0, right: 0, bottom: 0, left: 0 }}",'insets={insets}');s=s.replace('[isDesktop, activeRoute]', '[isDesktop, activeRoute, insets.bottom]');s=s.replace("paddingBottom: Platform.OS === 'ios' ? 20 : 8,", "paddingBottom: Math.max(insets.bottom, 8),");s=s.replace("height: Platform.OS === 'ios' ? 76 : 62,", "height: 56 + Math.max(insets.bottom, 8),");p.write_text(s)
p=Path('mobile/src/components/MapLocationPicker.tsx');s=p.read_text().replace("import React from 'react';", "import React, { useState } from 'react';\nimport { Input } from './Input';\nimport { Button } from './ui/Button';");s=s.replace('  const lat = latitude || 12.9716;\n  const lng = longitude || 77.5946;', '''  const lat = Number.isFinite(latitude) ? latitude : 12.9716;
  const lng = Number.isFinite(longitude) ? longitude : 77.5946;
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [coordinateError, setCoordinateError] = useState('');''');s=s.replace('        {onUseCurrentLocation && (', '''        {interactive && onSelectLocation && <View style={{ marginTop: 16 }}>
          <Text style={{ marginBottom: 12 }}>Enter exact coordinates to set the incident pin, or use your current location.</Text>
          <Input label="Incident latitude" value={manualLat} onChangeText={setManualLat} keyboardType="numbers-and-punctuation" placeholder="-90 to 90" />
          <Input label="Incident longitude" value={manualLng} onChangeText={setManualLng} keyboardType="numbers-and-punctuation" placeholder="-180 to 180" />
          {!!coordinateError && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 12 }}>{coordinateError}</Text>}
          <Button title="Set incident location" variant="outline" onPress={() => {
            const newLat = Number(manualLat), newLng = Number(manualLng);
            if (!manualLat.trim() || !manualLng.trim() || !Number.isFinite(newLat) || !Number.isFinite(newLng) || Math.abs(newLat) > 90 || Math.abs(newLng) > 180) { setCoordinateError('Enter a valid latitude and longitude.'); return; }
            setCoordinateError(''); onSelectLocation(newLat, newLng);
          }} />
        </View>}
        {onUseCurrentLocation && (''',1);p.write_text(s)
p=Path('mobile/src/components/ImagePickerCamera.tsx');s=p.read_text().replace("import React from 'react';", "import React, { useState } from 'react';");s=s.replace('  const handleTakePhoto', '''  const [error, setError] = useState('');
  const acceptImage = (asset: { uri?: string; mimeType?: string; fileSize?: number }, file?: File) => {
    const mime = file?.type || asset.mimeType;
    if ((mime && !['image/jpeg', 'image/png', 'image/webp'].includes(mime)) || (file?.size || asset.fileSize || 0) > 10 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP image, 10 MB or smaller.'); return;
    }
    setError('');
    if (file) onImageSelected(URL.createObjectURL(file));
    else if (asset.uri) onImageSelected(asset.uri);
  };
  const handleTakePhoto''');s=s.replace("input.accept = 'image/*';", "input.accept = 'image/jpeg,image/png,image/webp';").replace("          const uri = URL.createObjectURL(file);\n          onImageSelected(uri);", "          acceptImage({}, file);").replace('onImageSelected(result.assets[0].uri);', 'acceptImage(result.assets[0]);');s=s.replace("console.warn('Camera error:', err.message);", "setError(err.message || 'Camera could not be opened.');").replace("console.warn('Gallery pick error:', err.message);", "setError(err.message || 'Photo library could not be opened.');");s=s.replace('<View style={styles.container}>','<View style={styles.container}>\n      {!!error && <Text accessibilityRole="alert" style={{ color: COLORS.error, marginBottom: 12 }}>{error}</Text>}');s=s.replace("  buttonRow: {\n    flexDirection: 'row',", "  buttonRow: {\n    flexDirection: 'row',\n    flexWrap: 'wrap',");p.write_text(s)
