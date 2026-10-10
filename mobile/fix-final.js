const fs = require('fs');
const path = require('path');

// 1. Fix ProfileScreen.tsx
let fProfile = path.join(__dirname, 'src/screens/citizen/ProfileScreen.tsx');
let profileContent = fs.readFileSync(fProfile, 'utf8');

// Apply safe area
profileContent = profileContent.replace(/import\s+\{\s*View,/, "import {\n  View,");
profileContent = profileContent.replace("import {\n  View,\n  Text,\n  StyleSheet,\n  ScrollView,\n  Alert,\n  TouchableOpacity,\n  StatusBar,\n  Modal,\n  Platform,\n  Switch} from 'react-native';\nimport { SafeAreaView } from 'react-native-safe-area-context';", "import {\n  KeyboardAvoidingView,\n  View,\n  Text,\n  StyleSheet,\n  ScrollView,\n  Alert,\n  TouchableOpacity,\n  StatusBar,\n  Modal,\n  Platform,\n  Switch} from 'react-native';\nimport { SafeAreaView } from 'react-native-safe-area-context';");

// Apply KeyboardAvoidingView and hitSlop
profileContent = profileContent.replace('<ScrollView', '<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>\n      <ScrollView');
profileContent = profileContent.replace('</ScrollView>', '</ScrollView>\n      </KeyboardAvoidingView>');
profileContent = profileContent.replace('<TouchableOpacity\n            style={styles.backBtn}', '<TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Back"\n            style={styles.backBtn}');

// Add safe area context import if it got lost in checkout
if (profileContent.includes("import { SafeAreaView } from 'react-native';")) {
   profileContent = profileContent.replace("import { SafeAreaView } from 'react-native';", "");
   profileContent = profileContent.replace("import {\n  View", "import {\n  View");
   // Wait, simpler approach: just run migrate-safe-area.js after this
}

fs.writeFileSync(fProfile, profileContent);

// 2. Fix AuthorityNotificationsScreen.tsx
let fNotif = path.join(__dirname, 'src/screens/authority/AuthorityNotificationsScreen.tsx');
let notifContent = fs.readFileSync(fNotif, 'utf8');

notifContent = notifContent.replace('<TouchableOpacity\n          style={styles.backBtn}', '<TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}\n          style={styles.backBtn}');

fs.writeFileSync(fNotif, notifContent);

console.log('Fixed Profile and Notifications');
