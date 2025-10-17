// app/login.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../supabaseConfig.ts'; // Importamos Supabase
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa ambos campos.');
      return;
    }
    setError('');

    // Lógica de login con Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError('Usuario o contraseña incorrectos.');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top, paddingBottom: insets.bottom }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#ccc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable style={styles.buttonAction} onPress={handleLogin}>
              <Text style={styles.buttonActionText}>Ingresar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

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
      fontSize: 24, 
      fontFamily: 'Montserrat_500Medium',
      lineHeight: 24,
      textTransform: 'uppercase',
      color: '#e8716d',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: 45,
    },
    input: { 
      width: '100%',
      borderBottomWidth: 1,
      borderColor: '#ccc',
      paddingVertical: 10,
      paddingHorizontal: 6,
      fontFamily: 'Montserrat_300Light',
      fontSize: 16,
      color: '#8f8f8f',
      letterSpacing: 1,
      marginBottom: 20,
    },
    errorText: { 
      color: '#e14943', 
      textAlign: 'center', 
      marginBottom: 20,
      fontFamily: 'Montserrat_400Regular',
    },
    buttonAction: {
      backgroundColor: '#e8716d',
      borderRadius: 3,
      paddingVertical: 12,
      paddingHorizontal: 35,
      alignSelf: 'center',
      marginTop: 20,
    },
    buttonActionText: {
      fontSize: 16,
      fontFamily: 'Montserrat_300Light',
      color: '#fff',
      textTransform: 'uppercase',
      letterSpacing: 1,
    }
});

export default LoginScreen;