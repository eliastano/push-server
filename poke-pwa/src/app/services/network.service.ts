import { Injectable, signal } from '@angular/core';

export interface CacheStats {
  cachesCount: number;
  cacheNames: string[];
  totalCachedEntries: number;
}

@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly swActive = signal<boolean>(false);
  readonly cacheStats = signal<CacheStats>({
    cachesCount: 0,
    cacheNames: [],
    totalCachedEntries: 0,
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => this.isOnline.set(false));

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            console.log('[NGSW] Service Worker activo y controlando el cliente:', registration.scope);
            this.swActive.set(true);
            this.updateCacheStats();
          })
          .catch((err) => {
            console.warn('[NGSW] Error obteniendo registration del Service Worker:', err);
            this.swActive.set(false);
          });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          this.swActive.set(true);
          this.updateCacheStats();
        });
      }

      this.updateCacheStats();
    }
  }

  async updateCacheStats(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    try {
      const keys = await caches.keys();
      let entriesCount = 0;

      for (const key of keys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        entriesCount += requests.length;
      }

      this.cacheStats.set({
        cachesCount: keys.length,
        cacheNames: keys,
        totalCachedEntries: entriesCount,
      });
    } catch (err) {
      console.warn('Error leyendo CacheStorage:', err);
    }
  }
}
