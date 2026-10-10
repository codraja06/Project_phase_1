import os
import re

screens = [
    'src/screens/authority/AuthorityAnalyticsScreen.tsx',
    'src/screens/authority/AuthorityComplaintsScreen.tsx',
    'src/screens/authority/AuthorityMapScreen.tsx',
    'src/screens/authority/AuthorityNotificationsScreen.tsx',
    'src/screens/authority/AuthorityProfileScreen.tsx'
]

for screen in screens:
    path = os.path.join(r"d:\project phase 1\project1\mobile", screen)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'useMobileMenu' not in content:
        # Import
        if 'import { useBreakpoint }' in content:
            content = content.replace("import { useBreakpoint }", "import { useBreakpoint }\nimport { useMobileMenu } from '../../contexts/MobileMenuContext';")
        else:
            print(f"Could not find hook import in {screen}")
            continue

    # Find component start
    match = re.search(r'export const Authority.*?Screen\s*=\s*\([^)]*\)\s*=>\s*{', content)
    if match:
        insert_idx = match.end()
        # Insert hook
        if 'const { toggleMenu }' not in content:
            content = content[:insert_idx] + "\n  const { toggleMenu } = useMobileMenu();" + content[insert_idx:]
    
    # Replace navigation.goBack() or navigate('AuthorityDashboard')
    content = re.sub(
        r'<TouchableOpacity[^>]*style=\{styles\.backBtn\}[^>]*onPress=\{[^}]+\}[^>]*>',
        r'<TouchableOpacity style={styles.backBtn} onPress={toggleMenu}>',
        content
    )
    # Replace chevron-back with menu
    content = re.sub(
        r'<Ionicons name="chevron-back" (size=\{24\} color=\{[^}]+\}) />',
        r'<Ionicons name="menu" \1 />',
        content
    )
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {screen}")

print("Done patching.")
