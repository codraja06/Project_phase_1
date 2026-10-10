const fs = require('fs');

const path = 'src/screens/authority/AuthorityNotificationsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AuthorityHeader')) {
  content = content.replace(
    "import { LoadingSpinner } from '../../components/LoadingSpinner';",
    "import { LoadingSpinner } from '../../components/LoadingSpinner';\nimport { AuthorityHeader } from '../../components/AuthorityHeader';\nimport { useBreakpoint } from '../../hooks/useBreakpoint';"
  );
}

// 2. Extract before render
const splitString = "  return (\n    <SafeAreaView style={styles.safeArea}>";
const splitIndex = content.indexOf("  return (");
if (splitIndex === -1) {
  console.error("Could not find split string");
  process.exit(1);
}

const beforeRender = content.substring(0, splitIndex);

// Add useBreakpoint if not present inside component
let modBeforeRender = beforeRender;
if (!modBeforeRender.includes('const { isWide } = useBreakpoint();')) {
  modBeforeRender = modBeforeRender.replace(
    "export const AuthorityNotificationsScreen = ({ navigation }: any) => {",
    "export const AuthorityNotificationsScreen = ({ navigation }: any) => {\n  const { isWide } = useBreakpoint();"
  );
}

const newRender = `  return (
    <View style={styles.pageContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthorityHeader 
        title="Incident Feed" 
        subtitle="Real-time Operational Alerts"
        showMenuToggle={!isWide}
        onMenuPress={() => {}} 
      />

      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isWide && styles.listContentDesktop]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F172A']}
            />
          }
          ListEmptyComponent={
            <Animated.View entering={ZoomIn.delay(200)} style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={44} color={COLORS.slateMuted} />
              </View>
              <Text style={styles.emptyTitle}>No incident alerts</Text>
              <Text style={styles.emptySub}>
                Incoming citizen submissions and status changes will be listed here.
              </Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(100 + index * 40)} layout={Layout.springify()}>
              <NotificationItem
                item={item}
                onPress={() => {
                  if (item.complaintId) {
                    navigation.navigate('AuthorityComplaintDetail', {
                      complaintId: item.complaintId});
                  }
                }}
              />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 900
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['5xl']
  },
  listContentDesktop: {
    paddingHorizontal: 0,
    paddingTop: SPACING['2xl']
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['6xl']
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs
  },
  emptySub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280
  }
});
`;

fs.writeFileSync(path, modBeforeRender + newRender);
console.log('Successfully updated AuthorityNotificationsScreen');
