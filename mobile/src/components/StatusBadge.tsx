import { StyleSheet, Text, View } from 'react-native'
import type { TaskStatus } from '../types'
import { radius, statusBackgrounds, statusColors, statusLabels } from '../theme'

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: statusBackgrounds[status] }]}>
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.label, { color: statusColors[status] }]}>{statusLabels[status]}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
})