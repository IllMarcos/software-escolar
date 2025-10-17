// services/notificationService.ts
import { supabase } from '../supabaseConfig.ts';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// --- ARREGLO DEFINITIVO ---
// Se añaden las propiedades que faltaban: shouldShowBanner y shouldShowList.
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


export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Las notificaciones push solo funcionan en dispositivos físicos.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Permiso de notificaciones no concedido.');
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '10c6abb2-e158-4162-9a1c-a7a440fbeb02', // 👈 ¡RECUERDA REEMPLAZAR ESTO!
    })).data;

    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({ user_id: user.id, token: token }, { onConflict: 'user_id, token' });
      
      if (error) console.error("Error al guardar el token:", error);
      else console.log("Token de notificaciones guardado exitosamente.");
    }
  } catch (error) {
    console.error("Error al obtener el push token:", error);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}