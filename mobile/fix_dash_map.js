const fs = require('fs');
let dashPath = 'src/screens/authority/AuthorityDashboardScreen.tsx';
let dash = fs.readFileSync(dashPath, 'utf8');

const newMapUi = `
            <View style={styles.mapPreviewCard}>
              <View style={styles.mapHeader}>
                <View>
                  <Text style={styles.opsTitle}>Live Incident Map</Text>
                  <Text style={styles.opsSubtitle}>Map the incident locations across the city</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AuthorityMap')} style={styles.mapLink}>
                  <Text style={styles.mapLinkText}>Expand Map</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.mapPlaceholder, { backgroundColor: '#F1F5F9', position: 'relative', overflow: 'hidden', padding: 0 }]}>
                {/* Simulated map UI for the dashboard */}
                <Ionicons name="map" size={180} color="#E2E8F0" style={{ position: 'absolute', opacity: 0.5, top: 20, right: 20 }} />
                
                {/* Floating Filter Card */}
                <View style={{ position: 'absolute', left: 16, top: 16, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, ...SHADOWS.md }}>
                  {[
                    { label: 'All Incidents', count: 28, color: COLORS.primaryDark },
                    { label: 'Urgent', count: 6, color: COLORS.error },
                    { label: 'High', count: 8, color: COLORS.warning },
                    { label: 'Medium', count: 10, color: '#F59E0B' },
                    { label: 'Low', count: 4, color: COLORS.success },
                  ].map((f, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: f.color, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                      <Text style={{ ...TYPOGRAPHY.bodySmall, flex: 1, marginRight: 16 }}>{f.label}</Text>
                      <Text style={{ ...TYPOGRAPHY.caption, color: COLORS.slateMuted }}>({f.count})</Text>
                    </View>
                  ))}
                </View>

                {/* GIS Button */}
                <TouchableOpacity 
                  style={{ position: 'absolute', left: 16, bottom: 16, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', ...SHADOWS.sm }}
                  onPress={() => navigation.navigate('AuthorityMap')}
                >
                  <Ionicons name="compass-outline" size={16} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={{ ...TYPOGRAPHY.bodySmall, fontWeight: '600' }}>Open GIS View</Text>
                </TouchableOpacity>
                
                {/* Map controls */}
                <View style={{ position: 'absolute', right: 16, bottom: 16, backgroundColor: '#FFFFFF', borderRadius: 8, ...SHADOWS.sm, overflow: 'hidden' }}>
                  <TouchableOpacity style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}><Ionicons name="add" size={20} color={COLORS.slateDark} /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}><Ionicons name="remove" size={20} color={COLORS.slateDark} /></TouchableOpacity>
                  <TouchableOpacity style={{ padding: 8 }}><Ionicons name="locate" size={20} color={COLORS.slateDark} /></TouchableOpacity>
                </View>
              </View>
            </View>
`;

// Extract everything before mapPreviewCard and everything after it.
const parts = dash.split('<View style={styles.mapPreviewCard}>');
const secondPart = parts[1].split('</LeftColWrapper>');
dash = parts[0] + newMapUi.trim() + '\n\n          </LeftColWrapper>' + secondPart[1];

fs.writeFileSync(dashPath, dash);
console.log('Map placeholder updated securely');
