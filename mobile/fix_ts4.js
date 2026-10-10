const fs = require('fs');
let complaintsPath = 'src/screens/authority/AuthorityComplaintsScreen.tsx';
let complaints = fs.readFileSync(complaintsPath, 'utf8');
if (!complaints.includes('import { ScrollView } from \'react-native\'')) {
  complaints = 'import { ScrollView } from \'react-native\';\n' + complaints;
  fs.writeFileSync(complaintsPath, complaints);
  console.log('ScrollView imported.');
}
