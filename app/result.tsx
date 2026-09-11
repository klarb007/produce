import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { analyzeMeal } from '../lib/analyzeMeal';
import { deleteMeal, generateMealId, getMeal, saveMeal } from '../lib/mealsStore';
import { Macros } from '../lib/types';

const emptyMacros: Macros = { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 };

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; photoUri?: string }>();
  const isNew = !params.id;

  const [loading, setLoading] = useState(isNew);
  const [mealId] = useState(() => params.id ?? generateMealId());
  const [photoUri, setPhotoUri] = useState<string>(params.photoUri ?? '');
  const [title, setTitle] = useState('');
  const [macros, setMacros] = useState<Macros>(emptyMacros);
  const [recipe, setRecipe] = useState('');

  useEffect(() => {
    if (params.id) {
      // Editing an existing, already-saved meal.
      getMeal(params.id).then((meal) => {
        if (!meal) return;
        setPhotoUri(meal.photoUri);
        setTitle(meal.title);
        setMacros(meal.macros);
        setRecipe(meal.recipe);
      });
    } else if (params.photoUri) {
      // A brand-new photo: run it through the AI analyzer.
      analyzeMeal(params.photoUri)
        .then((analysis) => {
          setTitle(analysis.title);
          setMacros(analysis.macros);
          setRecipe(analysis.recipe);
          setLoading(false);
        })
        .catch((error: Error) => {
          Alert.alert('Analysis failed', error.message, [{ text: 'OK', onPress: () => router.back() }]);
        });
    }
  }, [params.id, params.photoUri]);

  function updateMacro(key: keyof Macros, text: string) {
    const value = Number(text.replace(/[^0-9]/g, '')) || 0;
    setMacros((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    await saveMeal({
      id: mealId,
      photoUri,
      title: title.trim() || 'Untitled Meal',
      macros,
      recipe,
      createdAt: Date.now(),
    });
    router.replace('/');
  }

  function handleDelete() {
    Alert.alert('Delete this meal?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(mealId);
          router.replace('/');
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={{ uri: photoUri }} style={styles.loadingImage} />
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Analyzing your meal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: photoUri }} style={styles.photo} />

      <Text style={styles.label}>Meal name</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Meal name" />

      <Text style={styles.label}>Nutrition (estimated - edit as needed)</Text>
      <View style={styles.macroRow}>
        <MacroField label="Calories" value={macros.calories} onChangeText={(t) => updateMacro('calories', t)} />
        <MacroField label="Protein (g)" value={macros.proteinGrams} onChangeText={(t) => updateMacro('proteinGrams', t)} />
      </View>
      <View style={styles.macroRow}>
        <MacroField label="Carbs (g)" value={macros.carbsGrams} onChangeText={(t) => updateMacro('carbsGrams', t)} />
        <MacroField label="Fat (g)" value={macros.fatGrams} onChangeText={(t) => updateMacro('fatGrams', t)} />
      </View>

      <Text style={styles.label}>Suggested recipe</Text>
      <TextInput
        style={[styles.input, styles.recipeInput]}
        value={recipe}
        onChangeText={setRecipe}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Meal</Text>
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Meal</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function MacroField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: number;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.macroField}>
      <Text style={styles.macroLabel}>{label}</Text>
      <TextInput
        style={styles.macroInput}
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType="number-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBF5' },
  content: { padding: 20, paddingBottom: 60 },
  loadingContainer: { flex: 1, backgroundColor: '#F4FBF5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingImage: { width: 220, height: 220, borderRadius: 16, backgroundColor: '#eee' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#5B6B5D' },
  photo: { width: '100%', height: 240, borderRadius: 16, backgroundColor: '#eee', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#5B6B5D', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1B3A1E',
    borderWidth: 1,
    borderColor: '#E2ECE3',
    marginBottom: 18,
  },
  recipeInput: { minHeight: 160 },
  macroRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  macroField: { flex: 1, marginBottom: 14 },
  macroLabel: { fontSize: 12, color: '#5B6B5D', marginBottom: 6 },
  macroInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#1B3A1E',
    borderWidth: 1,
    borderColor: '#E2ECE3',
    textAlign: 'center',
  },
  saveButton: { backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  deleteButtonText: { color: '#B3261E', fontSize: 15, fontWeight: '600' },
});
