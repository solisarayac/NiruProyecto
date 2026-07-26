import { View, StyleSheet } from 'react-native'
import { SkeletonBox } from '../Skeleton'
import { useTheme } from '../../context/ThemeContext'
import { Spacing, Radius } from '../../constants/theme'

export default function FavoritesSkeleton() {
  const { Colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.hero}>
        <SkeletonBox width={200} height={20} style={styles.center} />
        <SkeletonBox width={280} height={32} style={[styles.center, { marginTop: 8 }]} />
      </View>

      {[1, 2, 3].map(i => (
        <View key={i} style={[styles.card, { borderColor: Colors.grayBorder, backgroundColor: Colors.cardBackground }]}>
          <SkeletonBox width="100%" height={200} borderRadius={0} />
          <View style={styles.cardContent}>
            <SkeletonBox width="70%" height={18} style={{ marginBottom: Spacing.sm }} />
            <SkeletonBox width="50%" height={14} style={{ marginBottom: 4 }} />
            <SkeletonBox width="60%" height={14} style={{ marginBottom: Spacing.md }} />
            <SkeletonBox width="100%" height={40} borderRadius={Radius.full} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  center: { alignSelf: 'center' },
  card: { borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden', borderWidth: 1 },
  cardContent: { padding: Spacing.md },
})