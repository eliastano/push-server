import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PUSH_API_URL, VAPID_PUBLIC_KEY } from '../../services/push.config';
import { PushNotificationService } from '../../services/push-notification';

@Component({
  selector: 'app-push-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './push-test.html',
  styleUrl: './push-test.css',
})
export class PushTest {
  protected readonly push = inject(PushNotificationService);

  readonly title = signal<string>('¡Alerta Pokédex!');
  readonly body = signal<string>('Un nuevo Pokémon salvaje ha sido avistado en tu radar.');
  readonly apiUrl = PUSH_API_URL;
  readonly vapidKey = VAPID_PUBLIC_KEY;

  async onSubscribe(): Promise<void> {
    await this.push.subscribe();
  }

  async onUnsubscribe(): Promise<void> {
    await this.push.unsubscribe();
  }

  async sendCustomPush(): Promise<void> {
    if (!this.title().trim() || !this.body().trim()) {
      return;
    }
    await this.push.notify(this.title(), this.body());
  }

  setPreset(type: 'wild' | 'student' | 'sync'): void {
    if (type === 'wild') {
      this.title.set('⚡ ¡Mewtwo ha aparecido!');
      this.body.set('Un Pokémon legendario fue detectado cerca. ¡Abre tu Pokédex!');
    } else if (type === 'student') {
      this.title.set('Evaluación PWA - Desempeño');
      this.body.set('Prueba de Notificación Push para la evaluación de la PWA Pokédex.');
    } else if (type === 'sync') {
      this.title.set('Datos actualizados en Caché');
      this.body.set('El Service Worker ha sincronizado los datos de PokeAPI correctamente.');
    }
  }
}
