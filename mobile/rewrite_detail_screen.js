const fs = require('fs');

const path = 'src/screens/authority/AuthorityDetailScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AuthorityHeader')) {
  content = content.replace(
    "import { Badge } from '../../components/ui/Badge';",
    "import { Badge } from '../../components/ui/Badge';\nimport { AuthorityHeader } from '../../components/AuthorityHeader';"
  );
}

// 2. Extract before render
const splitString = "  return (\n    <SafeAreaView style={styles.safeArea}>\n      <StatusBar";
const splitIndex = content.indexOf("  return (");
if (splitIndex === -1) {
  console.error("Could not find split string");
  process.exit(1);
}

const beforeRender = content.substring(0, splitIndex);

const newRender = `  return (
    <View style={styles.pageContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthorityHeader 
        title="Incident Dossier" 
        subtitle={complaintCode}
        showMenuToggle={!isWide}
        onMenuPress={() => {}} 
      />

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={isWide ? styles.desktopScrollContent : styles.mobileScrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F172A']} />}
      >
        {isWide ? (
          <View style={styles.desktopContainer}>
            {/* LEFT COLUMN: EVIDENCE & DETAILS */}
            <View style={styles.desktopLeftCol}>
              <View style={styles.titleBadgeRow}>
                <Badge label={isVerified ? 'VERIFIED' : 'UNVERIFIED'} variant={isVerified ? 'success' : 'warning'} icon={<Ionicons name={isVerified ? "shield-checkmark" : "shield-outline"} size={10} color="#FFF" />} />
                <Badge label={\`\${priority.toUpperCase()} PRIORITY\`} variant={(priority === 'urgent' || priority === 'high') ? 'destructive' : 'secondary'} />
                <Badge label={complaint.status.toUpperCase()} variant={isResolved ? 'success' : isInProgress ? 'default' : 'warning'} />
              </View>

              <Text style={styles.titleText}>{complaint.title}</Text>
              
              <Animated.View entering={ZoomIn.delay(100)} style={styles.imageCard}>
                <DetectionOverlay imageUri={complaint.imageUrl} detections={complaint.boundingBoxes || []} confidence={complaint.aiConfidence} height={420} />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200)}>
                <Card style={styles.comparisonCard}>
                  <CardContent style={styles.comparisonContent}>
                    <View style={styles.compareCol}>
                      <Text style={styles.compareLabel}>AI PREDICTED CATEGORY</Text>
                      <Text style={styles.compareVal}>{aiLabel}</Text>
                      <Text style={styles.compareSub}>{complaint.aiConfidence ? \`\${Math.round(complaint.aiConfidence * 100)}% Confidence\` : 'YOLOv8 Analysis'}</Text>
                    </View>
                    <View style={styles.compareDivider} />
                    <View style={styles.compareCol}>
                      <Text style={styles.compareLabel}>CITIZEN REPORTED CATEGORY</Text>
                      <Text style={styles.compareVal}>{citizenCategoryLabel}</Text>
                      <Text style={styles.compareSub}>{complaint.customCategory ? 'Custom Entry' : 'Standard Menu'}</Text>
                    </View>
                  </CardContent>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300)} style={styles.descBlock}>
                <Text style={styles.sectionHeading}>INCIDENT NARRATIVE</Text>
                <Text style={styles.descriptionText}>{complaint.description || 'No description provided.'}</Text>
              </Animated.View>
            </View>

            {/* RIGHT COLUMN: METADATA & ACTIONS */}
            <View style={styles.desktopRightCol}>
              <Animated.View entering={FadeInUp.delay(100)}>
                <Card style={styles.metaCard}>
                  <CardContent>
                    <View style={styles.metaHeaderRow}>
                      <Ionicons name="person" size={16} color={COLORS.slateDark} />
                      <Text style={styles.metaCardTitle}>CITIZEN CONTACT</Text>
                    </View>
                    <Text style={styles.citizenNameText}>{citizenName}</Text>
                    {citizenEmail && <Text style={styles.metaDetailText}>✉ {citizenEmail}</Text>}
                    {citizenPhone && <Text style={styles.metaDetailText}>📞 {citizenPhone}</Text>}
                  </CardContent>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200)}>
                <Card style={styles.metaCard}>
                  <CardContent>
                    <View style={styles.metaHeaderRow}>
                      <Ionicons name="location" size={16} color={COLORS.slateDark} />
                      <Text style={styles.metaCardTitle}>GEOGRAPHIC DATA</Text>
                    </View>
                    <Text style={styles.locationText}>{complaint.address || 'Address derived from GPS coordinates'}</Text>
                    {complaint.latitude && complaint.longitude && (
                      <Text style={styles.metaDetailText}>Lat: {complaint.latitude.toFixed(5)}, Lng: {complaint.longitude.toFixed(5)}</Text>
                    )}
                  </CardContent>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300)}>
                <Card style={styles.metaCard}>
                  <CardContent>
                    <View style={styles.metaHeaderRow}>
                      <Ionicons name="time" size={16} color={COLORS.slateDark} />
                      <Text style={styles.metaCardTitle}>RESOLUTION PIPELINE</Text>
                    </View>
                    <ComplaintStatusTimeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} resolvedAt={complaint.resolvedAt} />
                  </CardContent>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(400)} style={styles.actionBlock}>
                <Text style={styles.sectionHeading}>MUNICIPAL ACTIONS</Text>
                <View style={styles.actionButtonGroup}>
                  {!isVerified && <Button title="Verify Incident" onPress={handleVerifyComplaint} variant="secondary" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                  {!isInProgress && !isResolved && <Button title="Mark In Progress" onPress={() => setProgressModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                  {isInProgress && <Button title="Mark Resolved" onPress={() => setResolveModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                  {isResolved && <Button title="Resolved ✓" onPress={() => {}} variant="outline" size="lg" disabled style={styles.actionBtn} />}
                  <Button title="Purge Record" onPress={() => setDeleteModalVisible(true)} variant="destructive" style={{ marginTop: SPACING.md }} />
                </View>
              </Animated.View>
            </View>
          </View>
        ) : (
          <View style={styles.mobileWrapper}>
            {/* MOBILE LAYOUT */}
            <View style={styles.titleBadgeRow}>
              <Badge label={isVerified ? 'VERIFIED' : 'UNVERIFIED'} variant={isVerified ? 'success' : 'warning'} />
              <Badge label={\`\${priority.toUpperCase()} PRIORITY\`} variant={(priority === 'urgent' || priority === 'high') ? 'destructive' : 'secondary'} />
            </View>
            
            <Text style={styles.titleText}>{complaint.title}</Text>

            <Animated.View entering={ZoomIn.delay(100)} style={styles.imageCard}>
              <DetectionOverlay imageUri={complaint.imageUrl} detections={complaint.boundingBoxes || []} confidence={complaint.aiConfidence} height={280} />
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200)}>
              <Card style={styles.comparisonCard}>
                <CardContent style={styles.comparisonContent}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>AI PREDICTED</Text>
                    <Text style={styles.compareVal}>{aiLabel}</Text>
                  </View>
                  <View style={styles.compareDivider} />
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>CITIZEN REPORTED</Text>
                    <Text style={styles.compareVal}>{citizenCategoryLabel}</Text>
                  </View>
                </CardContent>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300)}>
              <Card style={styles.metaCard}>
                <CardContent>
                  <View style={styles.metaHeaderRow}>
                    <Ionicons name="person" size={16} color={COLORS.slateDark} />
                    <Text style={styles.metaCardTitle}>CITIZEN CONTACT</Text>
                  </View>
                  <Text style={styles.citizenNameText}>{citizenName}</Text>
                  {citizenEmail && <Text style={styles.metaDetailText}>✉ {citizenEmail}</Text>}
                  {citizenPhone && <Text style={styles.metaDetailText}>📞 {citizenPhone}</Text>}
                </CardContent>
              </Card>
              
              <Card style={styles.metaCard}>
                <CardContent>
                  <View style={styles.metaHeaderRow}>
                    <Ionicons name="location" size={16} color={COLORS.slateDark} />
                    <Text style={styles.metaCardTitle}>GEOGRAPHIC DATA</Text>
                  </View>
                  <Text style={styles.locationText}>{complaint.address || 'GPS coordinates logged'}</Text>
                </CardContent>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400)} style={styles.descBlock}>
              <Text style={styles.sectionHeading}>INCIDENT NARRATIVE</Text>
              <Text style={styles.descriptionText}>{complaint.description || 'No description provided.'}</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500)}>
              <Card style={styles.metaCard}>
                <CardContent>
                  <Text style={styles.sectionHeading}>RESOLUTION PIPELINE</Text>
                  <ComplaintStatusTimeline status={complaint.status} createdAt={complaint.createdAt} updatedAt={complaint.updatedAt} resolvedAt={complaint.resolvedAt} />
                </CardContent>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600)} style={styles.actionBlock}>
              <Text style={styles.sectionHeading}>MUNICIPAL ACTIONS</Text>
              <View style={styles.actionButtonGroup}>
                {!isVerified && <Button title="Verify Incident" onPress={handleVerifyComplaint} variant="secondary" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {!isInProgress && !isResolved && <Button title="Mark In Progress" onPress={() => setProgressModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isInProgress && <Button title="Mark Resolved" onPress={() => setResolveModalVisible(true)} variant="default" size="lg" loading={actionLoading} style={styles.actionBtn} />}
                {isResolved && <Button title="Resolved ✓" onPress={() => {}} variant="outline" size="lg" disabled style={styles.actionBtn} />}
                <Button title="Purge Record" onPress={() => setDeleteModalVisible(true)} variant="destructive" style={{ marginTop: SPACING.md }} />
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog visible={progressModalVisible} title="Mark In Progress" message={\`Dispatch municipal team to inspect and resolve '\${complaint.title}'?\`} confirmText="Confirm Dispatch" confirmVariant="info" loading={actionLoading} onConfirm={() => handleUpdateStatus('In Progress')} onCancel={() => setProgressModalVisible(false)} />
      <ConfirmationDialog visible={resolveModalVisible} title="Certify Resolution" message={\`Confirm that work is completed and civic issue '\${complaint.title}' is remediated?\`} confirmText="Confirm Resolution" confirmVariant="primary" loading={actionLoading} onConfirm={() => handleUpdateStatus('Resolved')} onCancel={() => setResolveModalVisible(false)} />
      <ConfirmationDialog visible={deleteModalVisible} title="Purge Complaint" message={\`Permanently remove '\${complaint.title}' from the civic database?\`} confirmText="Purge Record" confirmVariant="danger" loading={actionLoading} onConfirm={handleDeleteComplaint} onCancel={() => setDeleteModalVisible(false)} />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(prev => ({ ...prev, visible: false }))} />
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flex: 1 },
  desktopScrollContent: { padding: SPACING['4xl'], maxWidth: 1400, alignSelf: 'center', width: '100%', paddingBottom: SPACING['6xl'] },
  mobileScrollContent: { padding: SPACING.lg, paddingBottom: SPACING['6xl'] },
  
  desktopContainer: { flexDirection: 'row', gap: SPACING['4xl'] },
  desktopLeftCol: { flex: 1.4, display: 'flex', flexDirection: 'column' },
  desktopRightCol: { flex: 1, display: 'flex', flexDirection: 'column' },
  mobileWrapper: { width: '100%', alignSelf: 'center' },

  titleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md, flexWrap: 'wrap' },
  titleText: { ...TYPOGRAPHY.h1, color: COLORS.textPrimary, marginBottom: SPACING.xl, letterSpacing: -0.5 },
  
  imageCard: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: '#FFFFFF', marginBottom: SPACING.xl },
  
  comparisonCard: { marginBottom: SPACING.xl, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.lg },
  comparisonContent: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg },
  compareCol: { flex: 1 },
  compareLabel: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.slateMuted, marginBottom: 8, letterSpacing: 0.5 },
  compareVal: { ...TYPOGRAPHY.bodySmall, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  compareSub: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  compareDivider: { width: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SPACING.xl },

  sectionHeading: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.slateMuted, marginBottom: SPACING.md, letterSpacing: 0.5 },
  descBlock: { marginBottom: SPACING['3xl'] },
  descriptionText: { ...TYPOGRAPHY.bodySmall, lineHeight: 24, color: COLORS.textPrimary },

  metaCard: { marginBottom: SPACING.lg, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.lg },
  metaHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: 8 },
  metaCardTitle: { ...TYPOGRAPHY.caption, fontWeight: '800', color: COLORS.slateDark, letterSpacing: 0.5 },
  citizenNameText: { ...TYPOGRAPHY.bodyBold, color: COLORS.textPrimary, marginBottom: 4 },
  metaDetailText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 4 },
  locationText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 4 },

  actionBlock: { marginTop: SPACING.md, padding: SPACING.xl, backgroundColor: '#FFFFFF', borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight },
  actionButtonGroup: { gap: SPACING.md },
  actionBtn: { width: '100%' }
});
`;

fs.writeFileSync(path, beforeRender + newRender);
console.log('Successfully updated AuthorityDetailScreen');
