import { View, StyleSheet } from 'react-native'
import { SkeletonBox } from '../Skeleton'
import { useTheme } from '../../context/ThemeContext'
import { Spacing, Radius } from '../../constants/theme'

export default function ShoppingListSkeleton() {
  const { Colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.hero}>
        <SkeletonBox width={180} height={20} style={styles.center} />
        <SkeletonBox width={220} height={32} style={[styles.center, { marginTop: 8 }]} />
      </View>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[styles.item, { backgroundColor: Colors.cardBackground, borderColor: Colors.grayBorder }]}>
          <SkeletonBox width={24} height={24} borderRadius={6} />
          <SkeletonBox width="70%" height={16} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  center: { alignSelf: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, gap: Spacing.sm },
})