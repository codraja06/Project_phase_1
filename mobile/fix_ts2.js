const fs = require('fs');
let detailPath = 'src/screens/authority/AuthorityDetailScreen.tsx';
let detail = fs.readFileSync(detailPath, 'utf8');
let lines = detail.split('\n');
lines.splice(117, 3,
'        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>',
'          <Ionicons name="chevron-back" size={24} color="#0F172A" />',
'        </TouchableOpacity>'
);
fs.writeFileSync(detailPath, lines.join('\n'));
