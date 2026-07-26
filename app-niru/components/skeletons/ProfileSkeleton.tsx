import { View, StyleSheet } from 'react-native'
import { SkeletonBox } from '../Skeleton'
import { useTheme } from '../../context/ThemeContext'
import { Spacing, Radius } from '../../constants/theme'

export default function ProfileSkeleton() {
  const { Colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <SkeletonBox width={120} height={52} style={styles.center} />

      <SkeletonBox width={100} height={100} borderRadius={50} style={[styles.center, { marginTop: Spacing.lg }]} />
      <SkeletonBox width={140} height={14} style={[styles.center, { marginTop: Spacing.sm }]} />

      <SkeletonBox width={160} height={18} style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={48} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={48} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={48} borderRadius={Radius.full} style={{ marginBottom: Spacing.sm }} />

      <SkeletonBox width={160} height={18} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={48} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
      <SkeletonBox width="100%" height={48} borderRadius={Radius.full} />

      <SkeletonBox width={160} height={18} style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }} />
      <View style={styles.grid}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonBox key={i} width="48%" height={120} borderRadius={Radius.md} style={{ marginBottom: Spacing.sm }} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.lg, paddingTop: 60 },
  center: { alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '2%' },
})