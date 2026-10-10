const fs = require('fs');

const path = 'src/screens/authority/AuthorityComplaintsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AuthorityHeader')) {
  content = content.replace(
    "import { Badge } from '../../components/ui/Badge';",
    "import { Badge } from '../../components/ui/Badge';\nimport { AuthorityHeader } from '../../components/AuthorityHeader';"
  );
}

// 2. Extract before renderBulkBar
const splitIndex = content.indexOf('  const renderBulkBar = () => {');
if (splitIndex === -1) {
  console.error("Could not find renderBulkBar");
  process.exit(1);
}

const beforeRender = content.substring(0, splitIndex);

const newRender = `  const renderBulkBar = () => {
    if (filteredComplaints.length === 0) return null;
    return (
      <View style={styles.bulkToolbar}>
        <TouchableOpacity onPress={handleSelectAll} style={styles.bulkSelectAllBtn} activeOpacity={0.7}>
          <Ionicons
            name={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0 ? 'checkbox' : 'square-outline'}
            size={18}
            color={COLORS.primaryDark}
            style={{ marginRight: SPACING.xs }}
          />
          <Text style={styles.bulkSelectAllText}>{selectedIds.length === 0 ? 'Select All' : \`\${selectedIds.length} Selected\`}</Text>
        </TouchableOpacity>

        {selectedIds.length > 0 && (
          <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOut.duration(200)} style={styles.bulkActionButtons}>
            <Button title="In Progress" variant="secondary" size="sm" onPress={() => handleBulkStatus('In Progress')} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="time" size={14} />} />
            <Button title="Resolve" variant="default" size="sm" onPress={() => handleBulkStatus('Resolved')} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="checkmark-circle" size={14} color="#FFF" />} />
            <Button title="Verify" variant="outline" size="sm" onPress={handleBulkVerify} disabled={bulkLoading} style={{ height: 32 }} icon={<Ionicons name="shield-checkmark" size={14} />} />
            <TouchableOpacity onPress={() => setSelectedIds([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingLeft: SPACING.xs }}>
              <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderContent = () => (
    <View style={styles.pageContainer}>
      <View style={styles.pageHeader}>
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle}>Incident Registry</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredComplaints.length} Records</Text>
          </View>
        </View>
        <Text style={styles.pageSubtitle}>Manage and update civic reports from citizens.</Text>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.slateMuted} />
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by ID, title, citizen..." style={styles.desktopSearch} />
        </View>
        <View style={styles.filterContainer}>
          <FilterChipGroup options={statusOptions} selectedValue={statusFilter} onSelect={setStatusFilter} containerStyle={styles.desktopFilterChips} />
        </View>
      </View>

      <View style={styles.tableCard}>
        {renderBulkBar()}
        
        {isDesktop && (
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableCheckboxHeader}>
              <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.8}>
                <Ionicons name={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0 ? 'checkbox' : 'square-outline'} size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.tableThumbHeader}><Text style={styles.tableHeaderLabel}>IMAGE</Text></View>
            <View style={styles.tableColTitle}><Text style={styles.tableHeaderLabel}>DOSSIER & CODE</Text></View>
            <View style={styles.tableColComparison}><Text style={styles.tableHeaderLabel}>AI / USER CATEGORY</Text></View>
            <View style={styles.tableColCitizen}><Text style={styles.tableHeaderLabel}>CITIZEN CONTACT</Text></View>
            <View style={styles.tableColDate}><Text style={styles.tableHeaderLabel}>DATE</Text></View>
            <View style={styles.tableColStatus}><Text style={styles.tableHeaderLabel}>STATUS</Text></View>
            <View style={styles.tableColActionsHeader}><Text style={styles.tableHeaderLabel}>ACTIONS</Text></View>
          </View>
        )}

        {loading && !refreshing ? (
          <LoadingSpinner message="Loading municipal complaints registry..." />
        ) : (
          <FlatList
            data={filteredComplaints}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(100 + index * 30)} layout={Layout.springify()}>
                {isDesktop ? (
                  <DesktopComplaintRow
                    complaint={item}
                    isSelected={selectedIds.includes(item._id)}
                    onToggleSelect={() => toggleSelect(item._id)}
                    onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
                    onVerify={handleVerify}
                    onReject={handleOpenReject}
                  />
                ) : (
                  <MobileAuthorityCard
                    complaint={item}
                    isSelected={selectedIds.includes(item._id)}
                    onToggleSelect={() => toggleSelect(item._id)}
                    onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item._id })}
                    onVerify={handleVerify}
                    onReject={handleOpenReject}
                  />
                )}
              </Animated.View>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
            ListEmptyComponent={EmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ConfirmationDialog visible={rejectModalVisible} title="Reject / Purge Incident" message={\`Permanently remove '\${selectedComplaint?.title || 'this complaint'}' from the database?\`} confirmText="Purge Record" confirmVariant="danger" loading={actionLoading} onConfirm={handleConfirmReject} onCancel={() => { setRejectModalVisible(false); setSelectedComplaint(null); }} />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))} />
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthorityHeader 
        title="All Complaints" 
        subtitle="Operations Registry" 
        showMenuToggle={!isWide}
        onMenuPress={() => {}} 
      />
      {isDesktop ? (
        <View style={styles.desktopWrapper}>
          {renderContent()}
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          {renderContent()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  desktopWrapper: { flex: 1, backgroundColor: '#F8FAFC', padding: SPACING['3xl'], alignItems: 'center' },
  pageContainer: { flex: 1, width: '100%', maxWidth: 1400, display: 'flex', flexDirection: 'column' },
  
  pageHeader: { marginBottom: SPACING.xl },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xs },
  pageTitle: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textPrimary },
  pageSubtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },

  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl, flexWrap: 'wrap', gap: SPACING.md },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 40, flex: 1, minWidth: 280, maxWidth: 400, ...SHADOWS.sm },
  desktopSearch: { flex: 1, marginLeft: 8, marginBottom: 0, borderWidth: 0, backgroundColor: 'transparent', height: '100%', elevation: 0, shadowOpacity: 0 },
  filterContainer: { flex: 1, minWidth: 300, alignItems: 'flex-end' },
  desktopFilterChips: { paddingVertical: 0 },

  tableCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.md, overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  bulkToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F1F5F9', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  bulkSelectAllBtn: { flexDirection: 'row', alignItems: 'center' },
  bulkSelectAllText: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: COLORS.textPrimary },
  bulkActionButtons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },

  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  tableCheckboxHeader: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  tableThumbHeader: { width: 44, marginRight: 16 },
  tableHeaderLabel: { ...TYPOGRAPHY.overline, color: COLORS.slateMuted, letterSpacing: 0.5 },
  
  tableColTitle: { flex: 2, marginRight: 16 },
  tableColComparison: { flex: 1.5, marginRight: 16 },
  tableColCitizen: { flex: 1.3, marginRight: 16 },
  tableColDate: { width: 80, marginRight: 16 },
  tableColStatus: { width: 105, marginRight: 16 },
  tableColActionsHeader: { width: 130 },
  tableColActions: { width: 130, flexDirection: 'row', alignItems: 'center' },

  listContent: { paddingBottom: SPACING['4xl'] },

  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, backgroundColor: '#FFFFFF' },
  tableRowSelected: { backgroundColor: '#F1F5F9' },
  tableRowHovered: { backgroundColor: '#F8FAFC' },
  tableCheckboxBtn: { width: 32, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  
  tableThumbWrapper: { width: 44, marginRight: 16, alignItems: 'center' },
  tableThumb: { width: 44, height: 44, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden', backgroundColor: COLORS.backgroundNeutral },
  tableThumbImg: { width: '100%', height: '100%' },
  tableThumbPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  
  civRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
  complaintCodeText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.slateMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  tableTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: COLORS.textPrimary },
  
  catCompareItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 2 },
  catCompareKey: { ...TYPOGRAPHY.caption, fontSize: 9, fontWeight: '800', color: COLORS.slateMuted, width: 28 },
  catCompareVal: { ...TYPOGRAPHY.caption, fontWeight: '600', color: COLORS.textSecondary, flex: 1 },
  
  tableCitizenName: { ...TYPOGRAPHY.bodySmall, fontWeight: '600', color: COLORS.textPrimary },
  tableCitizenContact: { ...TYPOGRAPHY.caption, color: COLORS.slateMuted, marginTop: 1 },
  
  tableDate: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, fontWeight: '500' },
  
  // Mobile specific
  mobileCard: { marginBottom: SPACING.md, padding: 0, marginHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: '#FFFFFF', ...SHADOWS.sm },
  mobileCardSelected: { borderColor: COLORS.primary, backgroundColor: '#F1F5F9' },
  mobileCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  mobileCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  mobileCheckboxBtn: { marginRight: 8, padding: 2 },
  mobileCardBody: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, alignItems: 'flex-start' },
  mobileCardImg: { width: 64, height: 64, borderRadius: BORDER_RADIUS.md },
  mobileCardImgPlaceholder: { width: 64, height: 64, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundNeutral, alignItems: 'center', justifyContent: 'center' },
  mobileCardContent: { flex: 1 },
  mobileCardTitle: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  mobileCardLocation: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: 2 },
  mobileCardCitizen: { ...TYPOGRAPHY.caption, color: COLORS.slateMuted, fontWeight: '500' },
  mobileCompareBanner: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  mobileCompareCol: { flex: 1 },
  mobileCompareLabel: { ...TYPOGRAPHY.caption, fontSize: 9, fontWeight: '800', color: COLORS.slateMuted, marginBottom: 2, letterSpacing: 0.3 },
  mobileCompareValue: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.textPrimary },
  mobileCompareDivider: { width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SPACING.sm },
  mobileCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight, backgroundColor: '#F8FAFC' },
  mobileCardDate: { ...TYPOGRAPHY.caption, color: COLORS.slateMuted, fontWeight: '600' },
  mobileActionGroup: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  
  emptyContainer: { padding: SPACING['5xl'], alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', marginTop: SPACING.xl },
  emptyIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  emptyTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptySub: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280 },
});
`;

fs.writeFileSync(path, beforeRender + newRender);
console.log('Successfully updated AuthorityComplaintsScreen');
