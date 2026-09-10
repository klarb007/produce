import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AddMealScreen() {
  const router = useRouter();

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access in Settings to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    handleResult(result);
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Enable photo library access in Settings to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    handleResult(result);
  }

  function handleResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || result.assets.length === 0) return;
    const uri = result.assets[0].uri;
    router.replace({ pathname: '/result', params: { photoUri: uri } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snap your meal</Text>
      <Text style={styles.subtitle}>
        We'll suggest a recipe and estimate the nutrition info from the photo.
        You can edit everything before saving.
      </Text>

      <Pressable style={styles.button} onPress={pickFromCamera}>
        <Text style={styles.buttonText}>Take a Photo</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.secondaryButton]} onPress={pickFromLibrary}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Choose from Library</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBF5', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1B3A1E', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#5B6B5D', textAlign: 'center', marginBottom: 32, lineHeight: 21 },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#2E7D32' },
  secondaryButtonText: { color: '#2E7D32' },
});
