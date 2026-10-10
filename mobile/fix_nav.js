const fs = require('fs');

// 1. types/navigation.ts
let typesPath = 'src/types/navigation.ts';
if (fs.existsSync(typesPath)) {
  let types = fs.readFileSync(typesPath, 'utf8');
  if (!types.includes('AuthorityUsers:')) {
    types = types.replace(
      'AuthorityProfile: undefined;',
      'AuthorityProfile: undefined;\n  AuthorityUsers: undefined;'
    );
    fs.writeFileSync(typesPath, types);
    console.log('types updated');
  }
}

// 2. navigation/AuthorityNavigator.tsx
let navPath = 'src/navigation/AuthorityNavigator.tsx';
let nav = fs.readFileSync(navPath, 'utf8');
if (!nav.includes('AuthorityUsersScreen')) {
  nav = nav.replace(
    'import { AuthorityProfileScreen } from \'../screens/authority/AuthorityProfileScreen\';',
    'import { AuthorityProfileScreen } from \'../screens/authority/AuthorityProfileScreen\';\nimport { AuthorityUsersScreen } from \'../screens/authority/AuthorityUsersScreen\';'
  );
  nav = nav.replace(
    '<Stack.Screen name="AuthorityProfile" component={AuthorityProfileScreen} />',
    '<Stack.Screen name="AuthorityProfile" component={AuthorityProfileScreen} />\n      <Stack.Screen name="AuthorityUsers" component={AuthorityUsersScreen} />'
  );
  fs.writeFileSync(navPath, nav);
  console.log('navigator updated');
}
