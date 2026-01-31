import * as Clipboard from 'expo-clipboard';

// Note: Cette fonction doit être appelée depuis un composant qui a accès au ToastProvider
// Pour l'utiliser, importez useToast depuis '../components/ToastNotification'
export const copyToClipboard = async (
    text: string,
    successMessage: string = 'Lien copié !',
    showToastFn?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
) => {
    try {
        await Clipboard.setStringAsync(text);

        // Si une fonction showToast est fournie, l'utiliser
        if (showToastFn) {
            showToastFn(successMessage, 'success');
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        if (showToastFn) {
            showToastFn('Échec de la copie', 'error');
        }
    }
};
