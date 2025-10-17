import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, StatusBar, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../supabaseConfig.ts';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      router.replace('/');
    } else {
      Alert.alert(
        'Registro Exitoso',
        'Por favor, revisa tu correo electrónico para confirmar tu cuenta.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para empezar</Text>
            
            <TextInput style={styles.input} placeholder="Correo Electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable style={styles.buttonAction} onPress={handleRegister}>
              <Text style={styles.buttonActionText}>Registrarse</Text>
            </Pressable>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Inicia Sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}


// Pega aquí los estilos del archivo login.tsx
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  container: { 
    flexGrow: 1,
    justifyContent: 'center', 
  },
  innerContainer: {
    paddingHorizontal: 40,
  },
  title: { 
    fontSize: 28, 
    fontFamily: 'Montserrat_700Bold',
    color: '#1a202c',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 45,
  },
  input: { 
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 20,
  },
  errorText: { 
    color: '#e53e3e', 
    textAlign: 'center', 
    marginBottom: 20,
    fontFamily: 'Montserrat_400Regular',
  },
  buttonAction: {
    backgroundColor: '#e8716d',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#e8716d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonActionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontFamily: 'Montserrat_400Regular',
    color: '#718096',
  },
  linkText: {
    fontFamily: 'Montserrat_700Bold',
    color: '#e8716d',
  }
});