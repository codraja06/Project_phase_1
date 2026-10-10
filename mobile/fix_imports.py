import os
import re

screens = [
    'src/screens/authority/AuthorityAnalyticsScreen.tsx',
    'src/screens/authority/AuthorityComplaintsScreen.tsx',
    'src/screens/authority/AuthorityMapScreen.tsx',
    'src/screens/authority/AuthorityProfileScreen.tsx'
]

for screen in screens:
    path = os.path.join(r"d:\project phase 1\project1\mobile", screen)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix the broken import
    broken_import = "import { useBreakpoint }\nimport { useMobileMenu } from '../../contexts/MobileMenuContext'; from '../../hooks/useBreakpoint';"
    correct_import = "import { useBreakpoint } from '../../hooks/useBreakpoint';\nimport { useMobileMenu } from '../../contexts/MobileMenuContext';"
    
    content = content.replace(broken_import, correct_import)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {screen}")

print("Done.")
