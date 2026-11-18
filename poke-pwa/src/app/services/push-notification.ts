import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { PUSH_API_URL, VAPID_PUBLIC_KEY } from './push.config';

export interface PushResponse {
  enviadas: number;
  fallidas: number;
  suscripciones: number;
}

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);

  readonly isSupported = this.swPush.isEnabled;
  readonly enabled = signal(false);
  readonly loading = signal(false);
  readonly lastResult = signal<string | null>(null);

  constructor() {
    this.checkSubscription();
  }

  async checkSubscription(): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        this.enabled.set(!!subscription);
      }
    } catch (err) {
      console.warn('Error verificando estado de suscripción Push:', err);
    }
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported) {
      this.lastResult.set('Las notificaciones Push no están soportadas o el Service Worker no está activo (recuerda probar en build de producción).');
      return false;
    }

    this.loading.set(true);
    this.lastResult.set(null);

    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        this.lastResult.set('Permiso de notificaciones bloqueado por el usuario en el navegador.');
        return false;
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: VAPID_PUBLIC_KEY,
      });

      await firstValueFrom(
        this.http.post(`${PUSH_API_URL}/subscribe`, subscription.toJSON())
      );

      this.enabled.set(true);
      this.lastResult.set('¡Suscripción Push registrada exitosamente en el servidor!');
      return true;
    } catch (error: any) {
      console.error('Error suscribiendo a Push:', error);
      const errorMsg = error?.message || 'Error al conectar con el servidor push o solicitar permiso.';
      this.lastResult.set(`Error al suscribir: ${errorMsg}`);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async unsubscribe(): Promise<boolean> {
    this.loading.set(true);
    this.lastResult.set(null);

    try {
      if (this.swPush.isEnabled) {
        await this.swPush.unsubscribe();
      } else if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      this.enabled.set(false);
      this.lastResult.set('Suscripción Push desactivada.');
      return true;
    } catch (error: any) {
      console.error('Error desuscribiendo:', error);
      this.lastResult.set('No se pudo desactivar la suscripción.');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async notify(title: string, body: string): Promise<PushResponse | null> {
    this.loading.set(true);
    this.lastResult.set(null);

    try {
      const response = await firstValueFrom(
        this.http.post<PushResponse>(`${PUSH_API_URL}/push`, { title, body })
      );

      this.lastResult.set(
        `Alerta enviada exitosamente. Suscripciones: ${response.suscripciones}, Enviadas: ${response.enviadas}, Fallidas: ${response.fallidas}.`
      );
      return response;
    } catch (error: any) {
      console.error('Error enviando notificación:', error);
      this.lastResult.set(
        'Error al enviar la notificación. Verifica que el servidor push esté ejecutándose y accesible por CORS.'
      );
      return null;
    } finally {
      this.loading.set(false);
    }
  }
}
