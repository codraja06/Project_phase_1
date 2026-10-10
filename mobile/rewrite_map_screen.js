const fs = require('fs');

const path = 'src/screens/authority/AuthorityMapScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AuthorityHeader')) {
  content = content.replace(
    "import { FilterChipGroup } from '../../components/FilterChip';",
    "import { FilterChipGroup } from '../../components/FilterChip';\nimport { AuthorityHeader } from '../../components/AuthorityHeader';"
  );
}

// 2. Extract before render
const splitString = "  // ─── Desktop Layout: side panel left + map right ───────────────────────────";
const splitIndex = content.indexOf(splitString);
if (splitIndex === -1) {
  console.error("Could not find split string");
  process.exit(1);
}

const beforeRender = content.substring(0, splitIndex);

const newRender = `  // ─── Shared Content ──────────────────────────────────────────────
  const renderPanel = () => (
    <View style={styles.desktopPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelHeaderTitle}>
          {filtered.length} Incident{filtered.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.panelHeaderSub}>Tap to preview on map</Text>
      </View>

      <View style={styles.panelFilterRow}>
        <FilterChipGroup
          options={filterOptions}
          selectedValue={statusFilter}
          onSelect={setStatusFilter}
          containerStyle={{ paddingVertical: 0 }}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.panelEmpty}>
          <Ionicons name="map-outline" size={36} color={COLORS.slateMuted} />
          <Text style={styles.panelEmptyText}>No incidents match the filter</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderSidePanelItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelListContent}
        />
      )}

      {selectedComplaint && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.panelFooter}>
          <View style={styles.panelFooterInfo}>
            <Text style={styles.panelFooterTitle} numberOfLines={1}>
              {selectedComplaint.title}
            </Text>
            <Text style={styles.panelFooterAddr} numberOfLines={1}>
              {selectedComplaint.address}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.panelFooterBtn}
            onPress={() =>
              navigation.navigate('AuthorityComplaintDetail', {
                complaintId: selectedComplaint._id})
            }
            activeOpacity={0.8}
          >
            <Text style={styles.panelFooterBtnText}>Inspect</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );

  const renderContent = () => (
    <View style={styles.mapScreenContent}>
      {isDesktop && renderPanel()}
      <View style={styles.desktopMapArea}>
        {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}
        {!isDesktop && selectedComplaint && (
          <View style={styles.mobilePreviewOverlay}>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {selectedComplaint.title}
                  </Text>
                  <Text style={styles.previewAddress} numberOfLines={1}>
                    {selectedComplaint.address}
                  </Text>
                </View>
                <StatusBadge status={selectedComplaint.status} size="sm" />
              </View>
              <TouchableOpacity
                style={styles.inspectBtn}
                onPress={() =>
                  navigation.navigate('AuthorityComplaintDetail', { complaintId: selectedComplaint._id})
                }
                activeOpacity={0.8}
              >
                <Text style={styles.inspectBtnText}>Inspect Incident</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthorityHeader 
        title="Incident Map" 
        subtitle="Geospatial Operations View" 
        showMenuToggle={!isDesktop}
        onMenuPress={() => {}} 
      />
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  mapScreenContent: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Panel
  desktopPanel: {
    width: 380,
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
    ...SHADOWS.md
  },
  panelHeader: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: '#FFFFFF'
  },
  panelHeaderTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  panelHeaderSub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.slateMuted,
    marginTop: 2,
  },
  panelFilterRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: '#F8FAFC'
  },
  panelListContent: {
    paddingBottom: SPACING['3xl'],
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 72,
    backgroundColor: '#FFFFFF'
  },
  panelItemSelected: {
    backgroundColor: '#F1F5F9',
  },
  panelAccentBar: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  panelItemContent: {
    flex: 1,
    minWidth: 0,
  },
  panelItemTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  panelItemAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateMuted,
    marginBottom: 6,
  },
  panelItemArrow: {
    paddingLeft: SPACING.md,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['4xl'],
  },
  panelEmptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.md,
  },
  panelFooterInfo: {
    flex: 1,
    minWidth: 0,
  },
  panelFooterTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  panelFooterAddr: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateMuted,
    marginTop: 4,
  },
  panelFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  panelFooterBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Map Area
  desktopMapArea: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fallbackMap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  fallbackTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.slateDark,
    marginTop: SPACING.md,
  },
  redYellowPinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuterYellowRing: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    padding: 6,
    borderRadius: 24,
  },
  pinInnerRedCircle: {
    backgroundColor: COLORS.error,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm
  },
  
  // Mobile Overlay
  mobilePreviewOverlay: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  previewTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  inspectBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
`;

fs.writeFileSync(path, beforeRender + newRender);
console.log('Successfully updated AuthorityMapScreen');
