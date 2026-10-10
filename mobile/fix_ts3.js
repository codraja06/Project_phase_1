const fs = require('fs');
let complaintsPath = 'src/screens/authority/AuthorityComplaintsScreen.tsx';
let complaints = fs.readFileSync(complaintsPath, 'utf8');

complaints = complaints.replace(
  'import { SafeAreaView } from \'react-native-safe-area-context\';\nimport { ScrollView } from \'react-native\';',
  'import { SafeAreaView } from \'react-native-safe-area-context\';'
);

if (!complaints.includes('ScrollView')) {
  complaints = complaints.replace(
    'import {\n  View,\n  Text,\n  StyleSheet,\n  FlatList,\n  TouchableOpacity,\n  RefreshControl,\n  StatusBar,\n  Platform} from \'react-native\';',
    'import {\n  View,\n  Text,\n  StyleSheet,\n  FlatList,\n  TouchableOpacity,\n  RefreshControl,\n  StatusBar,\n  Platform,\n  ScrollView\n} from \'react-native\';'
  );
}

fs.writeFileSync(complaintsPath, complaints);
