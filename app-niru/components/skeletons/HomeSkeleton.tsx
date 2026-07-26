import { View, StyleSheet } from 'react-native'
import { SkeletonBox } from '../Skeleton'
import { useTheme } from '../../context/ThemeContext'
import { Spacing, Radius } from '../../constants/theme'

export default function HomeSkeleton() {
  const { Colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.hero}>
        <SkeletonBox width={180} height={20} style={styles.center} />
        <SkeletonBox width={260} height={32} style={[styles.center, { marginTop: 8 }]} />
      </View>

      <View style={[styles.scanCard, { borderColor: Colors.grayBorder }]}>
        <SkeletonBox width="100%" height={180} borderRadius={Radius.md} />
      </View>

      <View style={styles.section}>
        <SkeletonBox width={160} height={22} style={{ marginBottom: Spacing.md }} />
        <View style={styles.row}>
          <SkeletonBox width={150} height={160} borderRadius={Radius.md} />
          <SkeletonBox width={150} height={160} borderRadius={Radius.md} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  center: { alignSelf: 'center' },
  scanCard: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.sm },
})