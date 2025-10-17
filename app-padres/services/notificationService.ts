// app-padres/services/notificationService.ts

import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../supabaseConfig.ts'; // Asegúrate de que la ruta sea correcta

// Configura cómo se deben mostrar las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // requerido en iOS
      shouldShowList: true,   // requerido en iOS
    };
  },
});
// Función principal para obtener el token de notificación
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no se ha determinado el permiso, se solicita al usuario
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Si después de solicitarlo, el permiso sigue sin ser concedido, devolvemos el estado
    if (finalStatus !== 'granted') {
      return { status: finalStatus, token: null }; // Devolvemos el estado
    }
    
    // Obtener el token
    try {
      // ✅ CORRECCIÓN PRINCIPAL AQUÍ: Se usa 'easConfig' en lugar de 'expoConfig'
      const projectId = (Constants as any).easConfig?.projectId;
      if (!projectId) {
        throw new Error('El projectId de EAS no está configurado en app.json');
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.error("Error al obtener el token de notificación:", e);
      return { status: 'error', token: null };
    }

  } else {
    Alert.alert('Debes usar un dispositivo físico para recibir notificaciones push.');
    return { status: 'not-a-device', token: null };
  }

  return { status: 'granted', token: token }; // Devolvemos el estado y el token
}

// Función para guardar el token en la base de datos
export async function saveTokenToSupabase(userId: string, token: string) {
    if (!userId || !token) return;

    const { error } = await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token: token }, { onConflict: 'token' });

    if (error) {
      console.error('Error al guardar el token en Supabase:', error);
    } else {
      console.log('Token guardado exitosamente.');
    }
}