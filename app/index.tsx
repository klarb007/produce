import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMeals } from '../lib/mealsStore';
import { Meal } from '../lib/types';

function MealRow({ meal, onPress }: { meal: Meal; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Image source={{ uri: meal.photoUri }} style={styles.thumbnail} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {meal.title}
        </Text>
        <Text style={styles.rowMacros}>
          {meal.macros.calories} cal · {meal.macros.proteinGrams}g protein
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { meals, reload } = useMeals();

  // Refresh the list every time this screen comes back into focus
  // (e.g. after saving a new meal or editing an existing one).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return (
    <View style={styles.container}>
      {meals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No meals yet</Text>
          <Text style={styles.emptySubtitle}>
            Take a photo of something you've cooked and get an instant recipe
            and nutrition breakdown.
          </Text>
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MealRow
              meal={item}
              onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/add-meal')}>
        <Text style={styles.fabText}>+ Add Meal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBF5' },
  list: { padding: 16, paddingBottom: 96 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  thumbnail: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#eee' },
  rowText: { marginLeft: 12, flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1B3A1E' },
  rowMacros: { fontSize: 13, color: '#5B6B5D', marginTop: 4 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1B3A1E', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#5B6B5D', textAlign: 'center', lineHeight: 21 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
