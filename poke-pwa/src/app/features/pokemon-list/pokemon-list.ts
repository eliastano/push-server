import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PokemonCardItem, PokemonDetail } from '../../models/pokemon.model';
import { NetworkService } from '../../services/network.service';
import { PokemonService } from '../../services/pokemon.service';
import { PushNotificationService } from '../../services/push-notification';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pokemon-list.html',
  styleUrl: './pokemon-list.css',
})
export class PokemonList implements OnInit {
  protected readonly pokeService = inject(PokemonService);
  protected readonly network = inject(NetworkService);
  protected readonly push = inject(PushNotificationService);

  readonly pokemons = signal<PokemonCardItem[]>([]);
  readonly loading = signal<boolean>(true);
  readonly loadingMore = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal<string>('');
  readonly selectedType = signal<string>('all');
  readonly offset = signal<number>(0);
  readonly limit = 36;

  // Detalle en modal
  readonly selectedPokemon = signal<PokemonDetail | null>(null);
  readonly modalLoading = signal<boolean>(false);
  readonly showShiny = signal<boolean>(false);

  // Tipos para filtrar
  readonly availableTypes = [
    'all',
    'grass',
    'fire',
    'water',
    'electric',
    'bug',
    'normal',
    'poison',
    'ground',
    'fairy',
    'fighting',
    'psychic',
    'rock',
    'ghost',
    'ice',
    'dragon',
  ];

  // Filtro computado por texto y tipo
  readonly filteredPokemons = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const type = this.selectedType().toLowerCase();
    const list = this.pokemons();

    return list.filter((p) => {
      const matchesNameOrId =
        !term ||
        p.name.toLowerCase().includes(term) ||
        String(p.id) === term ||
        `#${String(p.id).padStart(3, '0')}`.includes(term);

      const matchesType =
        type === 'all' || (p.types && p.types.includes(type));

      return matchesNameOrId && matchesType;
    });
  });

  ngOnInit(): void {
    // Inicializar inmediatamente desde caché para que NUNCA quede la pantalla en blanco
    const cached = this.pokeService.getLocalCache();
    if (cached && cached.length > 0) {
      this.pokemons.set(cached);
      this.loading.set(false);
    }
    this.loadPokemons();
  }

  loadPokemons(): void {
    this.error.set(null);

    this.pokeService.getPokemonList(this.limit, this.offset()).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.pokemons.set(data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('[PokemonList] Error o sin conexión al obtener lista:', err);
        // Garantizar que siempre se muestre el catálogo en caché
        const fallback = this.pokeService.getLocalCache();
        this.pokemons.set(fallback);
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.loadingMore()) return;

    this.loadingMore.set(true);
    const newOffset = this.offset() + this.limit;

    this.pokeService.getPokemonList(this.limit, newOffset).subscribe({
      next: (newData) => {
        if (newData && newData.length > 0) {
          this.pokemons.update((current) => [...current, ...newData]);
          this.offset.set(newOffset);
        }
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.warn('[PokemonList] Error cargando más pokemons:', err);
        this.loadingMore.set(false);
      },
    });
  }

  openDetail(poke: PokemonCardItem): void {
    this.showShiny.set(false);
    this.modalLoading.set(true);

    this.pokeService.getPokemonDetail(poke.id).subscribe({
      next: (detail) => {
        this.selectedPokemon.set(detail);
        this.modalLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.modalLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.selectedPokemon.set(null);
  }

  toggleShiny(): void {
    this.showShiny.update((v) => !v);
  }

  setSearchTerm(val: string): void {
    this.searchTerm.set(val);
  }

  setTypeFilter(type: string): void {
    this.selectedType.set(type);
  }

  formatId(id: number): string {
    return `#${String(id).padStart(3, '0')}`;
  }

  getTypeColor(type: string): string {
    return this.pokeService.getTypeColor(type);
  }

  async sendQuickPush(pokemonName: string): Promise<void> {
    const formatted = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);
    await this.push.notify(
      `¡${formatted} salvaje ha aparecido!`,
      `El Pokémon #${formatted} fue avistado en tu Pokédex PWA.`
    );
  }
}
