import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Compresse une image localement et retourne l'URI locale.
 * L'upload est désormais géré par le backend.
 * 
 * ALIGNED WITH MODULE 1 IMPLEMENTATION
 * 
 * @param {string} imageUri - L'URI locale de la photo.
 * @returns {Promise<string>} L'URI de l'image compressée.
 */
export async function compressImage(imageUri: string): Promise<string> {
  if (!imageUri) {
    throw new Error("L'URI de l'image est manquante.");
  }

  console.log("Compression de l'image...");

  // Sur le Web, la manipulation d'image peut être lente. 
  // On ajoute un timeout de sécurité pour éviter de bloquer l'UI indéfiniment.
  const compressPromise = ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1000 } }], // Redimensionnement raisonnable
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout de compression (15s) dépassé")), 15000)
  );

  try {
    const manipulationResult = await Promise.race([compressPromise, timeoutPromise]);
    // @ts-ignore - manipulationResult can be cast if needed or trusted from library
    return manipulationResult.uri;
  } catch (error) {
    console.warn("Échec ou timeout de compression, utilisation de l'image originale:", error);
    return imageUri; // Fallback sur l'originale si la compression échoue/timeout
  }
}