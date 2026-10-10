const fs = require('fs');
let headerPath = 'src/components/AuthorityHeader.tsx';
let header = fs.readFileSync(headerPath, 'utf8');

if (!header.includes('isProfileOpen')) {
  // 1. Add import
  header = header.replace(
    'import { useNavigation } from \'@react-navigation/native\';',
    'import { useNavigation } from \'@react-navigation/native\';\nimport { useAuth } from \'../context/AuthContext\';'
  );
  
  // 2. Add state
  header = header.replace(
    'const [isNotifOpen, setIsNotifOpen] = useState(false);',
    'const [isNotifOpen, setIsNotifOpen] = useState(false);\n  const [isProfileOpen, setIsProfileOpen] = useState(false);\n  const { logout, user } = useAuth();'
  );
  
  // 3. Add click outside handler
  header = header.replace(
    'setIsNotifOpen(false);',
    'setIsNotifOpen(false);\n        setIsProfileOpen(false);'
  );
  header = header.replace(
    '[isNotifOpen]',
    '[isNotifOpen, isProfileOpen]'
  );
  
  // 4. Update Profile Button
  const profileDropdownUI = `
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={[styles.profileDropdown, isProfileOpen && styles.iconBtnActive]}
              onPress={(e) => {
                if (Platform.OS === 'web') e.stopPropagation();
                setIsProfileOpen(!isProfileOpen);
                setIsNotifOpen(false);
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'J'}</Text>
              </View>
              {isDesktop && (
                <>
                  <View style={styles.profileText}>
                    <Text style={styles.profileName}>{user?.name || 'John Doe'}</Text>
                    <Text style={styles.profileRole}>{user?.role || 'Admin'}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={14} color={COLORS.slateMuted} />
                </>
              )}
            </TouchableOpacity>

            {isProfileOpen && (
              <View 
                style={styles.profileMenu}
                //@ts-ignore
                onClick={(e: any) => e.stopPropagation()}
              >
                <View style={styles.profileMenuHeader}>
                  <Text style={styles.profileMenuName}>{user?.name || 'John Doe'}</Text>
                  <Text style={styles.profileMenuEmail}>{user?.email || 'admin@civictrack.gov'}</Text>
                </View>
                <View style={styles.profileMenuList}>
                  <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setIsProfileOpen(false); navigation.navigate('AuthorityProfile' as never); }}>
                    <Ionicons name="person-outline" size={18} color={COLORS.slateDark} />
                    <Text style={styles.profileMenuItemText}>My Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileMenuItem} onPress={() => { setIsProfileOpen(false); navigation.navigate('AuthorityProfile' as never); }}>
                    <Ionicons name="settings-outline" size={18} color={COLORS.slateDark} />
                    <Text style={styles.profileMenuItemText}>Settings</Text>
                  </TouchableOpacity>
                  <View style={styles.profileMenuDivider} />
                  <TouchableOpacity style={styles.profileMenuItem} onPress={logout}>
                    <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
                    <Text style={[styles.profileMenuItemText, { color: COLORS.error }]}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
`;
  
  header = header.replace(
    /<TouchableOpacity style={styles\.profileDropdown}>[\s\S]*?<\/TouchableOpacity>/,
    profileDropdownUI.trim()
  );
  
  // 5. Add styles
  const extraStyles = `
  profileMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.card,
    zIndex: 9999,
  },
  profileMenuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  profileMenuName: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  profileMenuEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileMenuList: {
    paddingVertical: 8,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profileMenuItemText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
`;
  
  header = header.replace(
    'avatar: {',
    extraStyles + '\n  avatar: {'
  );

  fs.writeFileSync(headerPath, header);
  console.log('Profile menu added');
}
