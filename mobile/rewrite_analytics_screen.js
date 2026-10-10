const fs = require('fs');

const path = 'src/screens/authority/AuthorityAnalyticsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('AuthorityHeader')) {
  content = content.replace(
    "import { useBreakpoint } from '../../hooks/useBreakpoint';",
    "import { useBreakpoint } from '../../hooks/useBreakpoint';\nimport { AuthorityHeader } from '../../components/AuthorityHeader';"
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

const newRender = `  return (
    <View style={styles.pageContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthorityHeader 
        title="Municipal Analytics" 
        subtitle="Operations Intelligence Dashboard"
        showMenuToggle={!isWide}
        onMenuPress={() => {}} 
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          isWide && styles.scrollContentDesktop,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F172A']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          
          <Animated.View entering={FadeInDown.duration(400)} style={styles.timeframeRow}>
            {(['7d', '30d', 'all'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.tfBtn, timeframe === tf && styles.tfBtnActive]}
                onPress={() => setTimeframe(tf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tfBtnText, timeframe === tf && styles.tfBtnTextActive]}>
                  {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : 'All Time'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Executive KPI Row */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIcon}>
                <Ionicons name="speedometer-outline" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.kpiValue}>18.4 hrs</Text>
              <Text style={styles.kpiLabel}>Avg Resolution Velocity</Text>
              <View style={styles.kpiTrend}>
                <Ionicons name="arrow-up" size={12} color="#059669" />
                <Text style={styles.kpiTrendText}>+22% this week</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="flame-outline" size={20} color={COLORS.error} />
              </View>
              <Text style={[styles.kpiValue, { color: COLORS.error }]}>94.2%</Text>
              <Text style={styles.kpiLabel}>Critical SLA Adherence</Text>
              <View style={styles.kpiTrend}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.kpiTrendText}>Within 24h target</Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={20} color="#2563EB" />
              </View>
              <Text style={[styles.kpiValue, { color: '#2563EB' }]}>88%</Text>
              <Text style={styles.kpiLabel}>Field Officer Utilization</Text>
              <View style={styles.kpiTrend}>
                <Text style={[styles.kpiTrendText, { color: COLORS.slateDark }]}>6 Active Units</Text>
              </View>
            </View>
          </Animated.View>

          {/* Grid Layout for Desktop */}
          <View style={isWide ? styles.desktopGrid : styles.mobileGrid}>
            
            {/* Left Column in Grid */}
            <View style={isWide ? styles.gridCol : undefined}>
              {/* Category Distribution Card */}
              <Animated.View entering={FadeInUp.delay(200)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="pie-chart" size={18} color={COLORS.slateDark} style={{ marginRight: 8 }} />
                  <Text style={styles.cardTitle}>Incident Category Distribution</Text>
                </View>

                <View style={styles.categoryList}>
                  {categories.map((cat, index) => (
                    <Animated.View entering={ZoomIn.delay(300 + index * 50)} key={cat.name} style={styles.catItem}>
                      <View style={styles.catMetaRow}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catCount}>
                          {cat.count} reports ({cat.pct}%)
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <Animated.View
                          style={[
                            styles.progressBarFill,
                            { width: \`\${cat.pct}%\`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Priority Severity Breakdown */}
              <Animated.View entering={FadeInUp.delay(300)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                  <Text style={styles.cardTitle}>Priority Severity Matrix</Text>
                </View>

                <View style={styles.priorityGrid}>
                  <View style={[styles.priorityPill, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.priorityPillNum, { color: '#DC2626' }]}>4</Text>
                    <Text style={styles.priorityPillLabel}>Urgent (P1)</Text>
                  </View>

                  <View style={[styles.priorityPill, { borderColor: '#FED7AA', backgroundColor: '#FFF7ED' }]}>
                    <Text style={[styles.priorityPillNum, { color: '#D97706' }]}>8</Text>
                    <Text style={styles.priorityPillLabel}>High (P2)</Text>
                  </View>
                </View>
                <View style={[styles.priorityGrid, { marginTop: SPACING.sm }]}>
                  <View style={[styles.priorityPill, { borderColor: '#FEF08A', backgroundColor: '#FEFCE8' }]}>
                    <Text style={[styles.priorityPillNum, { color: '#854D0E' }]}>11</Text>
                    <Text style={styles.priorityPillLabel}>Medium (P3)</Text>
                  </View>

                  <View style={[styles.priorityPill, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
                    <Text style={[styles.priorityPillNum, { color: '#475569' }]}>5</Text>
                    <Text style={styles.priorityPillLabel}>Routine (P4)</Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Right Column in Grid */}
            <View style={isWide ? styles.gridCol : undefined}>
              {/* Regional Risk & Ward Table */}
              <Animated.View entering={FadeInUp.delay(400)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="map" size={18} color={COLORS.slateDark} style={{ marginRight: 8 }} />
                  <Text style={styles.cardTitle}>Ward Incident Concentration</Text>
                </View>

                <View style={styles.wardTable}>
                  <View style={styles.wardTableHeader}>
                    <Text style={[styles.wardCol, { flex: 2 }]}>WARD / DISTRICT</Text>
                    <Text style={[styles.wardCol, { textAlign: 'center' }]}>ACTIVE</Text>
                    <Text style={[styles.wardCol, { textAlign: 'center' }]}>CLEARED</Text>
                    <Text style={[styles.wardCol, { textAlign: 'right' }]}>RISK</Text>
                  </View>

                  {wards.map((w) => (
                    <View key={w.name} style={styles.wardRow}>
                      <Text style={[styles.wardName, { flex: 2 }]} numberOfLines={1}>
                        {w.name}
                      </Text>
                      <Text style={[styles.wardVal, { textAlign: 'center' }]}>{w.active}</Text>
                      <Text style={[styles.wardVal, { textAlign: 'center', color: '#059669' }]}>
                        {w.resolved}
                      </Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View
                          style={[
                            styles.riskBadge,
                            w.risk === 'High'
                              ? styles.riskHigh
                              : w.risk === 'Medium'
                              ? styles.riskMedium
                              : styles.riskLow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskText,
                              w.risk === 'High'
                                ? styles.riskTextHigh
                                : w.risk === 'Medium'
                                ? styles.riskTextMedium
                                : styles.riskTextLow,
                            ]}
                          >
                            {w.risk}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            </View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingHorizontal: 4,
  },
  tfBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm
  },
  tfBtnActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark
  },
  tfBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  tfBtnTextActive: {
    color: '#FFFFFF'
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['5xl']
  },
  scrollContentDesktop: {
    padding: SPACING['3xl'],
    paddingBottom: SPACING['6xl']
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center'
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.xl
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },
  kpiValue: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -1
  },
  kpiLabel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.slateMuted,
    marginBottom: SPACING.md
  },
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  kpiTrendText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#059669'
  },
  
  // Grid layout
  desktopGrid: {
    flexDirection: 'row',
    gap: SPACING.xl,
    alignItems: 'flex-start'
  },
  mobileGrid: {
    flexDirection: 'column',
    gap: SPACING.lg
  },
  gridCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.xl
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.xl,
    ...SHADOWS.sm
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.md
  },
  cardTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.textPrimary,
  },
  categoryList: {
    gap: SPACING.lg
  },
  catItem: {
    width: '100%'
  },
  catMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  catName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  catCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateMuted,
    fontWeight: '600'
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  priorityPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1
  },
  priorityPillNum: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
    fontWeight: '800'
  },
  priorityPillLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5
  },
  wardTable: {
    width: '100%'
  },
  wardTableHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.sm
  },
  wardCol: {
    flex: 1,
    ...TYPOGRAPHY.overline,
    color: COLORS.slateMuted
  },
  wardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  wardName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  wardVal: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.textPrimary
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full
  },
  riskHigh: {
    backgroundColor: '#FEF2F2'
  },
  riskMedium: {
    backgroundColor: '#FEFCE8'
  },
  riskLow: {
    backgroundColor: '#ECFDF5'
  },
  riskText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800'
  },
  riskTextHigh: {
    color: '#DC2626'
  },
  riskTextMedium: {
    color: '#D97706'
  },
  riskTextLow: {
    color: '#059669'
  }
});
`;

fs.writeFileSync(path, beforeRender + newRender);
console.log('Successfully updated AuthorityAnalyticsScreen');
