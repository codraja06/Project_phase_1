const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src', 'screens'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('styles.backBtn')) {
    content = content.replace(/<TouchableOpacity([^>]+style=\{styles\.backBtn[^>]*)/g, (match) => {
       if (match.includes('accessibilityLabel')) return match;
       return match.replace('<TouchableOpacity', '<TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Back"');
    });
    changed = true;
  }
  
  // 2. KeyboardAvoidingView in ProfileScreen
  // (Only process exact file path to avoid AuthorityProfileScreen)
  if (file.endsWith('citizen\\ProfileScreen.tsx') || file.endsWith('citizen/ProfileScreen.tsx')) {
    if (!content.includes('KeyboardAvoidingView')) {
       content = content.replace("import { View,", "import { KeyboardAvoidingView, View,");
       content = content.replace('<ScrollView', '<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>\n      <ScrollView');
       content = content.replace('</ScrollView>', '</ScrollView>\n      </KeyboardAvoidingView>');
       changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
