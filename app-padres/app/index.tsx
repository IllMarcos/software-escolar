// app/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { supabase } from '../supabaseConfig.ts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router'; // Asegúrate de importar Link
import { Ionicons } from '@expo/vector-icons';
import { User } from '@supabase/supabase-js';

type HistorialItem = {
  id: number;
  tipo: 'entrada' | 'salida';
  timestamp: string;
};

// --- ✅ CORRECCIÓN #1: TIPO DE DATO ---
// 'grupos' es un objeto, no un array, porque un alumno solo pertenece a un grupo.
type AlumnoInfo = {
  id: string;
  nombre_completo: string;
  qr_code_url: string;
  grupos: { nombre: string } | null; // Corregido: de array de objetos a un solo objeto o null
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [alumno, setAlumno] = useState<AlumnoInfo | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: studentData, error: studentError } = await supabase
        .from('alumnos')
        .select(`id, nombre_completo, qr_code_url, grupos ( nombre )`)
        .eq('tutor_id', user.id)
        .single();
      
      if (studentError && studentError.code !== 'PGRST116') {
        console.error("Error al buscar alumno:", studentError.message);
        setLoading(false);
        return;
      }
      
      if (!studentData) {
        setLoading(false);
        router.replace('/link-student');
        return;
      }
      
      
      const { data: historyData } = await supabase
        .from('historial_asistencia')
        .select('id, tipo, timestamp')
        .eq('alumno_id', studentData.id)
        .order('timestamp', { ascending: false });
      
      if (historyData) {
        setHistorial(historyData);
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };
  
  const renderItem = ({ item }: { item: HistorialItem }) => {
    const date = new Date(item.timestamp);
    const time = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const isEntry = item.tipo === 'entrada';

    return (
      <View style={styles.historyItem}>
        <View style={[styles.iconContainer, { backgroundColor: isEntry ? '#34d399' : '#fb7185' }]}>
          <Ionicons name={isEntry ? "arrow-down-outline" : "arrow-up-outline"} size={24} color="white" />
        </View>
        <View style={styles.historyDetails}>
          <Text style={styles.historyType}>{isEntry ? 'Entrada Registrada' : 'Salida Registrada'}</Text>
          <Text style={styles.historyTime}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#e8716d" /></View>;
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Hola,</Text>
            {user && <Text style={styles.headerSubtitle}>{user.email}</Text>}
          </View>
          <View style={styles.headerIcons}>
            <Link href="../avisos" asChild>
              <TouchableOpacity style={{ marginRight: 16 }}>
                <Ionicons name="notifications-outline" size={28} color="#4a5568" />
              </TouchableOpacity>
            </Link>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#4a5568" />
            </TouchableOpacity>
          </View>
        </View>

        {alumno ? (
          <>
            <View style={styles.studentCard}>
              <View>
                <Text style={styles.studentName}>{alumno.nombre_completo}</Text>
                {/* --- ✅ CORRECCIÓN #2: LÓGICA DE RENDERIZADO --- */}
                {/* Se accede directamente a la propiedad 'nombre' del objeto 'grupos'. */}
                <Text style={styles.studentGroup}>
                  Grupo: {alumno.grupos ? alumno.grupos.nombre : 'Sin grupo asignado'}
                </Text>
              </View>
              {alumno.qr_code_url && (
                <Image source={{ uri: alumno.qr_code_url }} style={styles.qrCode} />
              )}
            </View>

            <Text style={styles.sectionTitle}>Historial de Asistencia</Text>

            <FlatList
              data={historial}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay registros de asistencia todavía.</Text>}
            />
          </>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay un alumno asignado a esta cuenta.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ESTILOS (sin cambios, solo se añade el estilo para headerIcons)
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#f4f7fa',
      },
      container: {
        flex: 1,
      },
      centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
      },
      headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      headerTitle: {
        fontSize: 28,
        fontFamily: 'Montserrat_700Bold',
        color: '#1a202c',
      },
      headerSubtitle: {
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        color: '#718096',
      },
      studentCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
      studentName: {
        fontSize: 20,
        fontFamily: 'Montserrat_700Bold',
        color: '#2d3748',
      },
      studentGroup: {
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        color: '#718096',
        marginTop: 4,
      },
      qrCode: {
        width: 60,
        height: 60,
        borderRadius: 8,
      },
      sectionTitle: {
        fontSize: 18,
        fontFamily: 'Montserrat_700Bold',
        color: '#2d3748',
        marginTop: 30,
        marginBottom: 15,
        paddingHorizontal: 20,
      },
      historyItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
      },
      iconContainer: {
        padding: 12,
        borderRadius: 999,
      },
      historyDetails: {
        marginLeft: 15,
      },
      historyType: {
        fontSize: 16,
        fontFamily: 'Montserrat_500Medium',
        color: '#2d3748',
      },
      historyTime: {
        fontSize: 14,
        fontFamily: 'Montserrat_400Regular',
        color: '#a0aec0',
      },
      emptyText: {
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'Montserrat_400Regular',
        color: '#718096',
        marginTop: 40,
      },
});