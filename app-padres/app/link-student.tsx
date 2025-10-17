// app/link-student.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../supabaseConfig.ts'; // Asegúrate que la ruta sea correcta
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LinkStudentScreen() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleLink = async () => {
        if (!code.trim()) {
            setError('Por favor, introduce un código.');
            return;
        }
        setLoading(true);
        setError('');

        // Llamamos a una Edge Function para hacer la vinculación de forma segura
        const { error: functionError } = await supabase.functions.invoke('link-student', {
            body: { inviteCode: code.trim().toUpperCase() }
        });

        setLoading(false);

        if (functionError) {
            // Mostramos un mensaje más amigable al usuario
            if (functionError.message.includes("inválido")) {
                setError("El código de invitación no es válido. Por favor, verifícalo.");
            } else if (functionError.message.includes("utilizado")) {
                setError("Este código de invitación ya ha sido utilizado.");
            } else {
                setError("Ocurrió un error. Inténtalo de nuevo.");
            }
        } else {
            Alert.alert('¡Éxito!', 'Te has vinculado correctamente con el alumno.');
            router.replace('/'); // Redirige a la pantalla principal para que recargue los datos
        }
    };

    return (
        <View style={[styles.wrapper, { paddingTop: insets.top }]}>
            <View style={styles.innerContainer}>
                <Text style={styles.title}>Vincular Alumno</Text>
                <Text style={styles.subtitle}>Introduce el código de invitación que te proporcionó la escuela.</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="CÓDIGO DE 6 DÍGITOS"
                    placeholderTextColor="#a0aec0"
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    maxLength={6}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable style={styles.buttonAction} onPress={handleLink} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonActionText}>Vincular</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

// Estilos consistentes con el resto de la app
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f4f7fa' },
  innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 28, fontFamily: 'Montserrat_700Bold', color: '#1a202c', textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#718096', textAlign: 'center', marginBottom: 45 },
  input: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingVertical: 15, 
    paddingHorizontal: 15, 
    fontFamily: 'Montserrat_700Bold', 
    fontSize: 20, 
    color: '#2d3748', 
    marginBottom: 20, 
    textAlign: 'center', 
    letterSpacing: 3,
  },
  errorText: { color: '#e53e3e', textAlign: 'center', marginBottom: 20, fontFamily: 'Montserrat_400Regular' },
  buttonAction: { backgroundColor: '#e8716d', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 10, shadowColor: "#e8716d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  buttonActionText: { fontSize: 16, fontFamily: 'Montserrat_700Bold', color: '#fff', textTransform: 'uppercase' },
});