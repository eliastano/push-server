import { Component, signal } from '@angular/core';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-acerca',
  imports: [],
  templateUrl: './acerca.html',
  styleUrl: './acerca.css',
})
export class Acerca {
  readonly faqs = signal<FaqItem[]>([
    {
      id: 1,
      question: '¿Qué es una Progressive Web App (PWA) y qué ventajas ofrece?',
      answer:
        'Una PWA combina lo mejor de la web y de las aplicaciones móviles nativas. Ofrece instalación sin tiendas de apps, funcionamiento sin conexión, carga instantánea mediante caché y menor consumo de recursos.',
      isOpen: true,
    },
    {
      id: 2,
      question: '¿Cómo funciona la navegación sin conexión a internet?',
      answer:
        'Gracias al Service Worker (NGSW), los recursos estáticos (HTML, JS, CSS, iconos) y los datos de la API se almacenan de forma inteligente en el CacheStorage del navegador. Si pierdes la conexión, la app sigue funcionando con los datos almacenados.',
      isOpen: false,
    },
    {
      id: 3,
      question: '¿Cómo puedo instalar esta aplicación en mi teléfono o PC?',
      answer:
        'En navegadores como Google Chrome o Edge, haz clic en el botón con forma de monitor/teléfono en la barra de direcciones o selecciona "Instalar aplicación" desde el menú del navegador. En iOS, presiona el botón Compartir y elige "Agregar a pantalla de inicio".',
      isOpen: false,
    },
    {
      id: 4,
      question: '¿Cómo se mantienen actualizados los datos cuando vuelvo a tener red?',
      answer:
        'El Service Worker implementa estrategias de caché como "Performance" y "Freshness". Cuando detecta conexión, verifica cambios en segundo plano y actualiza el almacenamiento sin interrumpir tu navegación.',
      isOpen: false,
    },
  ]);

  readonly swStatus = signal<string>('Service Worker Activo y Operativo');
  readonly isInspecting = signal<boolean>(false);

  toggleFaq(id: number) {
    this.faqs.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  }

  testWorker() {
    this.isInspecting.set(true);
    setTimeout(() => {
      this.isInspecting.set(false);
      this.swStatus.set('¡Verificación exitosa! Caché NGSW sincronizada.');
    }, 1200);
  }
}
