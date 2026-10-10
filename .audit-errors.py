from pathlib import Path
# Visible API errors instead of incorrectly presenting failed requests as empty data.
files={
 'citizen/ComplaintHistoryScreen.tsx':'fetchComplaints', 'citizen/ComplaintDetailScreen.tsx':'fetchDetail', 'citizen/NotificationsScreen.tsx':'fetchComplaints',
 'authority/AuthorityDashboardScreen.tsx':'fetchDashboardData', 'authority/AuthorityComplaintsScreen.tsx':'fetchComplaints', 'authority/AuthorityDetailScreen.tsx':'fetchDetail', 'authority/AuthorityMapScreen.tsx':'fetchMapComplaints', 'authority/AuthorityNotificationsScreen.tsx':'fetchComplaints'
}
for f,retry in files.items():
 p=Path('mobile/src/screens')/f;s=p.read_text();s="import { ErrorState } from '../../components/ErrorState';\n"+s;s=s.replace('  const [loading, setLoading]', "  const [loadError, setLoadError] = useState('');\n  const [loading, setLoading]",1);s=s.replace('      setLoading(true);','      setLoadError(\'\');\n      setLoading(true);',1);s=s.replace('    } catch (error) {','    } catch (error: any) {\n      setLoadError(error.message || \'Could not load records. Please retry.\');',1)
 # All hooks precede this point (complaints registers selection hooks later).
 if 'AuthorityComplaintsScreen' in f:
  pos=s.index('  if (loading');s=s[:pos]+f'  if (loadError) return <ErrorState message={{loadError}} onRetry={{{retry}}} />;\n'+s[pos:]
 else:
  pos=s.index('  if (loading');s=s[:pos]+f'  if (loadError) return <ErrorState message={{loadError}} onRetry={{{retry}}} />;\n'+s[pos:]
 p.write_text(s)
p=Path('mobile/src/components/ErrorState.tsx');s=p.read_text().replace('<View style={styles.container}>','<View accessibilityRole="alert" style={styles.container}>').replace('          style={styles.retryBtn}','          accessibilityRole="button"\n          style={styles.retryBtn}');p.write_text(s)
# Keyboard-accessible standard touchables; meaningful icon labels are set separately.
import re
for p in Path('mobile/src').rglob('*.tsx'):
 s=p.read_text()
 s=re.sub(r'<TouchableOpacity\b(?:(?!accessibilityRole)[^>])*>',lambda m: m.group(0) if 'accessibilityRole' in m.group(0) else m.group(0).replace('<TouchableOpacity','<TouchableOpacity accessibilityRole="button"',1),s)
 p.write_text(s)
# Native Alert has no web implementation. Use a platform-aware message helper.
for f in ['citizen/ProfileScreen.tsx','authority/AuthorityProfileScreen.tsx']:
 p=Path('mobile/src/screens')/f;s=p.read_text();s="import { showMessage } from '../../utils/showMessage';\n"+s;s=s.replace('Alert.alert(', 'showMessage(')
 for field in ['editProfileVisible','changePasswordVisible','notifSettingsVisible']:
  setter='set'+field[0].upper()+field[1:];s=s.replace(f'<Modal visible={{{field}}} animationType="fade" transparent>',f'<Modal visible={{{field}}} animationType="fade" transparent onRequestClose={{() => {setter}(false)}}>')
 s=s.replace('<View style={styles.modalContent}>','<ScrollView style={{ maxHeight: \'90%\', width: \'100%\', maxWidth: 440 }} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">')
 s=s.replace('          </View>\n        </View>\n      </Modal>', '          </ScrollView>\n        </View>\n      </Modal>')
 s=re.sub(r'<TouchableOpacity accessibilityRole="button" onPress=\{\(\) => set(\w+)Visible\(false\)\}',r'<TouchableOpacity accessibilityRole="button" accessibilityLabel="Close dialog" onPress={() => set\1Visible(false)}',s)
 p.write_text(s)
p=Path('mobile/src/screens/citizen/ProfileScreen.tsx');s=p.read_text();s=s.replace('Instant alerts when status changes','Push delivery is not configured').replace('Weekly municipal resolution summaries','Email delivery is not configured').replace('Direct SMS notifications for emergency hazards','SMS delivery is not configured');s=re.sub(r'<Switch value=\{\w+\} onValueChange=\{\w+\}', '<Switch value={false} disabled accessibilityLabel="Delivery not configured"',s);s=s.replace('title="Save Preferences"','title="Done"');p.write_text(s)
p=Path('mobile/src/screens/authority/AuthorityDetailScreen.tsx');s=p.read_text().replace('  useEffect(() => { fetchDetail(); }, [fetchDetail]);\n','');p.write_text(s)
p=Path('mobile/src/components/SuccessModal.tsx');s=p.read_text().replace("complaintId || 'CIV-100245'", "complaintId || 'Registered'");p.write_text(s)
