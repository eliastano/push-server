import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NetworkService } from './services/network.service';
import { PushNotificationService } from './services/push-notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly push = inject(PushNotificationService);
  protected readonly network = inject(NetworkService);

  async togglePush(): Promise<void> {
    if (this.push.enabled()) {
      await this.push.unsubscribe();
    } else {
      await this.push.subscribe();
    }
  }
}
