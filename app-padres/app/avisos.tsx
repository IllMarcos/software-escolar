// app-padres/app/avisos.tsx

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseConfig.ts';

// Interfaz que coincide con tu tabla 'avisos' de la base de datos
interface Aviso {
  id: string; // uuid es un string
  created_at: string;
  titulo: string;
  mensaje: string;
}

export default function AvisosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grupoId, setGrupoId] = useState<string | null>(null);

  const fetchAvisos = async (studentGroupId: string | null) => {
    // Si no tenemos el ID del grupo del alumno, no podemos buscar avisos.
    if (!studentGroupId) {
        setAvisos([]);
        setLoading(false);
        setRefreshing(false);
        return;
    }

    try {
      // ✅ LÓGICA DE FILTRADO CORREGIDA
      // Construimos el filtro:
      // 1. grupo_id es igual al del alumno, O
      // 2. grupo_id es NULO (aviso para todos)
      const filter = `grupo_id.eq.${studentGroupId},grupo_id.is.null`;

      const { data, error } = await supabase
        .from('avisos')
        .select('id, created_at, titulo, mensaje')
        .or(filter) // Aplicamos el filtro OR
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAvisos(data);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error";
      Alert.alert('Error', 'No se pudieron cargar los avisos: ' + message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para obtener los datos del usuario y el grupo de su alumno
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Buscamos el alumno vinculado al tutor para obtener su grupo_id
      const { data: studentData, error: studentError } = await supabase
        .from('alumnos')
        .select('grupo_id')
        .eq('tutor_id', user.id)
        .single();

      if (studentError && studentError.code !== 'PGRST116') {
        console.error("Error al buscar grupo del alumno:", studentError.message);
        setLoading(false);
        return;
      }

      if (studentData && studentData.grupo_id) {
        setGrupoId(studentData.grupo_id);
        // Una vez que tenemos el grupo_id, buscamos los avisos
        await fetchAvisos(studentData.grupo_id);
      } else {
        // Si el alumno no tiene grupo o no hay alumno, no mostramos avisos
        setAvisos([]);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
  };

  const renderAviso = ({ item }: { item: Aviso }) => (
    <View style={styles.avisoCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="megaphone-outline" size={24} color="#e8716d" />
      </View>
      <View style={styles.avisoContent}>
        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.body}>{item.mensaje}</Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#1a202c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Avisos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e8716d" style={styles.centered} />
      ) : (
        <FlatList
          data={avisos}
          renderItem={renderAviso}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ 
            paddingTop: 80 + insets.top,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay avisos para tu grupo.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e8716d']} />}
        />
      )}
    </View>
  );
}

// ESTILOS (sin cambios)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(244, 247, 250, 0.85)',
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#1a202c',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avisoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 15,
    paddingTop: 2,
  },
  avisoContent: {
    flex: 1,
  },
  title: { 
    fontSize: 18, 
    fontFamily: 'Montserrat_700Bold', 
    color: '#2d3748', 
    marginBottom: 8 
  },
  body: { 
    fontSize: 16, 
    fontFamily: 'Montserrat_400Regular', 
    color: '#4a5568', 
    lineHeight: 24, 
    marginBottom: 12 
  },
  date: { 
    fontSize: 12, 
    fontFamily: 'Montserrat_400Regular', 
    color: '#a0aec0', 
    textAlign: 'right' 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: '50%', 
    fontSize: 16, 
    fontFamily: 'Montserrat_400Regular', 
    color: '#718096' 
  },
});