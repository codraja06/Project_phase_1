const fs = require('fs');

// 1. AuthorityAnalyticsScreen
let analyticsPath = 'src/screens/authority/AuthorityAnalyticsScreen.tsx';
let analytics = fs.readFileSync(analyticsPath, 'utf8');
analytics = analytics.replace(/\.\.\.SHADOWS\.md/g, '...SHADOWS.card');
fs.writeFileSync(analyticsPath, analytics);

// 2. AuthorityMapScreen
let mapPath = 'src/screens/authority/AuthorityMapScreen.tsx';
let map = fs.readFileSync(mapPath, 'utf8');
map = map.replace(/\.\.\.SHADOWS\.md/g, '...SHADOWS.card');
fs.writeFileSync(mapPath, map);

// 3. AuthorityComplaintsScreen
let complaintsPath = 'src/screens/authority/AuthorityComplaintsScreen.tsx';
let complaints = fs.readFileSync(complaintsPath, 'utf8');
complaints = complaints.replace(/\.\.\.SHADOWS\.md/g, '...SHADOWS.card');
if (!complaints.includes('useBreakpoint')) {
  complaints = complaints.replace(
    "import { useFocusEffect } from '@react-navigation/native';",
    "import { useFocusEffect } from '@react-navigation/native';\nimport { useBreakpoint } from '../../hooks/useBreakpoint';"
  );
}
// Inject ScrollView and isWide
if (!complaints.includes('ScrollView')) {
  complaints = complaints.replace(
    "import { SafeAreaView } from 'react-native-safe-area-context';",
    "import { SafeAreaView } from 'react-native-safe-area-context';\nimport { ScrollView } from 'react-native';"
  );
}
if (!complaints.includes('const { isDesktop, isWide }')) {
  complaints = complaints.replace(
    "const { isDesktop } = useBreakpoint();",
    "const { isDesktop, isWide } = useBreakpoint();"
  );
}
fs.writeFileSync(complaintsPath, complaints);

// 4. AuthorityDetailScreen
let detailPath = 'src/screens/authority/AuthorityDetailScreen.tsx';
let detail = fs.readFileSync(detailPath, 'utf8');
// Fix early return for not found
detail = detail.replace(
  '<SafeAreaView style={styles.safeArea}>',
  '<View style={styles.pageContainer}>'
);
detail = detail.replace(
  '<View style={styles.headerBar}>',
  '<View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>'
);
detail = detail.replace(
  '<TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn} onPress={() => navigation.goBack()}>',
  '<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}><Ionicons name="chevron-back" size={24} color="#0F172A" /></TouchableOpacity>'
);
detail = detail.replace(
  '<Text style={styles.headerTitle}>Incident Dossier</Text>',
  '<Text style={{ fontSize: 20, fontWeight: "bold", color: "#0F172A" }}>Incident Dossier</Text>'
);
detail = detail.replace(
  '</SafeAreaView>',
  '</View>'
);
fs.writeFileSync(detailPath, detail);

// 5. CitizenDashboardScreen
let citizenPath = 'src/screens/citizen/CitizenDashboardScreen.tsx';
let citizen = fs.readFileSync(citizenPath, 'utf8');
citizen = citizen.replace(/height: '100vh'/g, "height: Platform.OS === 'web' ? ('100vh' as any) : '100%'");
fs.writeFileSync(citizenPath, citizen);

console.log('TypeScript errors patched.');
