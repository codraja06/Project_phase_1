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
  if (content.match(/import\s+\{[^}]*SafeAreaView[^}]*\}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/(import\s+\{[^}]*)\bSafeAreaView\b,?\s*([^}]*\}\s+from\s+['"]react-native['"])/, '$1$2');
    content = content.replace(/(from\s+['"]react-native['"];?)/, "$1\nimport { SafeAreaView } from 'react-native-safe-area-context';");
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/\{\s*,/g, '{');
    content = content.replace(/,\s*\}/g, '}');
    fs.writeFileSync(file, content);
    console.log('Updated SafeAreaView in ' + file);
  }
});
