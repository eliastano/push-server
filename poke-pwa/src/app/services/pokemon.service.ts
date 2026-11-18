import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  PokemonCardItem,
  PokemonDetail,
  PokemonListResponse,
} from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly STORAGE_KEY = 'pwa_pokemons_cache_v2';

  // Semilla de Pokémon iniciales para garantizar que NUNCA quede en blanco sin internet
  private readonly initialPokemons: PokemonCardItem[] = [
    { id: 1, name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/', image: this.getArtworkUrl(1), types: ['grass', 'poison'], hp: 45, attack: 49, defense: 49 },
    { id: 2, name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/', image: this.getArtworkUrl(2), types: ['grass', 'poison'], hp: 60, attack: 62, defense: 63 },
    { id: 3, name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon/3/', image: this.getArtworkUrl(3), types: ['grass', 'poison'], hp: 80, attack: 82, defense: 83 },
    { id: 4, name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/', image: this.getArtworkUrl(4), types: ['fire'], hp: 39, attack: 52, defense: 43 },
    { id: 5, name: 'charmeleon', url: 'https://pokeapi.co/api/v2/pokemon/5/', image: this.getArtworkUrl(5), types: ['fire'], hp: 58, attack: 64, defense: 58 },
    { id: 6, name: 'charizard', url: 'https://pokeapi.co/api/v2/pokemon/6/', image: this.getArtworkUrl(6), types: ['fire', 'flying'], hp: 78, attack: 84, defense: 78 },
    { id: 7, name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/', image: this.getArtworkUrl(7), types: ['water'], hp: 44, attack: 48, defense: 65 },
    { id: 8, name: 'wartortle', url: 'https://pokeapi.co/api/v2/pokemon/8/', image: this.getArtworkUrl(8), types: ['water'], hp: 59, attack: 63, defense: 80 },
    { id: 9, name: 'blastoise', url: 'https://pokeapi.co/api/v2/pokemon/9/', image: this.getArtworkUrl(9), types: ['water'], hp: 79, attack: 83, defense: 100 },
    { id: 10, name: 'caterpie', url: 'https://pokeapi.co/api/v2/pokemon/10/', image: this.getArtworkUrl(10), types: ['bug'], hp: 45, attack: 30, defense: 35 },
    { id: 25, name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/', image: this.getArtworkUrl(25), types: ['electric'], hp: 35, attack: 55, defense: 40 },
    { id: 26, name: 'raichu', url: 'https://pokeapi.co/api/v2/pokemon/26/', image: this.getArtworkUrl(26), types: ['electric'], hp: 60, attack: 90, defense: 55 },
    { id: 39, name: 'jigglypuff', url: 'https://pokeapi.co/api/v2/pokemon/39/', image: this.getArtworkUrl(39), types: ['normal', 'fairy'], hp: 115, attack: 45, defense: 20 },
    { id: 52, name: 'meowth', url: 'https://pokeapi.co/api/v2/pokemon/52/', image: this.getArtworkUrl(52), types: ['normal'], hp: 40, attack: 45, defense: 35 },
    { id: 54, name: 'psyduck', url: 'https://pokeapi.co/api/v2/pokemon/54/', image: this.getArtworkUrl(54), types: ['water'], hp: 50, attack: 52, defense: 48 },
    { id: 94, name: 'gengar', url: 'https://pokeapi.co/api/v2/pokemon/94/', image: this.getArtworkUrl(94), types: ['ghost', 'poison'], hp: 60, attack: 65, defense: 60 },
    { id: 133, name: 'eevee', url: 'https://pokeapi.co/api/v2/pokemon/133/', image: this.getArtworkUrl(133), types: ['normal'], hp: 55, attack: 55, defense: 50 },
    { id: 143, name: 'snorlax', url: 'https://pokeapi.co/api/v2/pokemon/143/', image: this.getArtworkUrl(143), types: ['normal'], hp: 160, attack: 110, defense: 65 },
    { id: 149, name: 'dragonite', url: 'https://pokeapi.co/api/v2/pokemon/149/', image: this.getArtworkUrl(149), types: ['dragon', 'flying'], hp: 91, attack: 134, defense: 95 },
    { id: 150, name: 'mewtwo', url: 'https://pokeapi.co/api/v2/pokemon/150/', image: this.getArtworkUrl(150), types: ['psychic'], hp: 106, attack: 110, defense: 90 },
    { id: 151, name: 'mew', url: 'https://pokeapi.co/api/v2/pokemon/151/', image: this.getArtworkUrl(151), types: ['psychic'], hp: 100, attack: 100, defense: 100 },
  ];

  constructor() {
    this.ensureSeedData();
  }

  // Obtener lista de Pokémon: primero caché/memoria, luego red
  getPokemonList(limit: number = 50, offset: number = 0): Observable<PokemonCardItem[]> {
    return this.http
      .get<PokemonListResponse>(`${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`)
      .pipe(
        map((response) => {
          const freshItems: PokemonCardItem[] = response.results.map((item) => {
            const id = this.extractIdFromUrl(item.url);
            const known = this.initialPokemons.find((p) => p.id === id);
            return {
              id,
              name: item.name,
              url: item.url,
              image: this.getArtworkUrl(id),
              types: known?.types || [this.guessType(id)],
              hp: known?.hp || 50,
              attack: known?.attack || 55,
              defense: known?.defense || 50,
            };
          });

          this.saveLocalCache(freshItems);
          return freshItems;
        }),
        catchError((err) => {
          console.warn('[PokemonService] Sin red/Offline. Retornando caché garantizado:', err);
          return of(this.getLocalCache());
        })
      );
  }

  // Obtener detalle completo de un Pokémon por id o nombre
  getPokemonDetail(idOrName: string | number): Observable<PokemonDetail> {
    const query = typeof idOrName === 'string' ? idOrName.toLowerCase().trim() : String(idOrName);
    const detailCacheKey = `pwa_poke_detail_${query}`;

    return this.http.get<PokemonDetail>(`${this.baseUrl}/pokemon/${query}`).pipe(
      tap((detail) => {
        try {
          // Guardar una versión compacta del detalle en localStorage para emergencias offline
          const compact = {
            id: detail.id,
            name: detail.name,
            height: detail.height,
            weight: detail.weight,
            base_experience: detail.base_experience,
            sprites: detail.sprites,
            types: detail.types,
            stats: detail.stats,
            abilities: detail.abilities,
          };
          localStorage.setItem(detailCacheKey, JSON.stringify(compact));
        } catch {}
      }),
      catchError((err) => {
        console.warn(`[PokemonService] Error de red al consultar detalle de #${query}, usando fallback offline:`, err);
        try {
          const local = localStorage.getItem(detailCacheKey);
          if (local) {
            return of(JSON.parse(local) as PokemonDetail);
          }
        } catch {}

        // Si no está guardado individualmente, construir un detalle básico desde la lista
        const idNum = Number(query) || 1;
        const fallbackCard = this.getLocalCache().find((p) => p.id === idNum || p.name === query) || this.initialPokemons[0];
        const basicDetail: PokemonDetail = {
          id: fallbackCard.id,
          name: fallbackCard.name,
          base_experience: 100,
          height: 7,
          weight: 69,
          sprites: {
            front_default: this.getSpriteUrl(fallbackCard.id),
            front_shiny: this.getSpriteUrl(fallbackCard.id),
            other: {
              'official-artwork': {
                front_default: fallbackCard.image,
                front_shiny: fallbackCard.image,
              },
            },
          },
          types: (fallbackCard.types || ['normal']).map((t, idx) => ({
            slot: idx + 1,
            type: { name: t, url: '' },
          })),
          stats: [
            { base_stat: fallbackCard.hp || 50, effort: 0, stat: { name: 'hp', url: '' } },
            { base_stat: fallbackCard.attack || 55, effort: 0, stat: { name: 'attack', url: '' } },
            { base_stat: fallbackCard.defense || 50, effort: 0, stat: { name: 'defense', url: '' } },
            { base_stat: 65, effort: 0, stat: { name: 'special-attack', url: '' } },
            { base_stat: 65, effort: 0, stat: { name: 'special-defense', url: '' } },
            { base_stat: 60, effort: 0, stat: { name: 'speed', url: '' } },
          ],
          abilities: [
            { ability: { name: 'adaptabilidad', url: '' }, is_hidden: false, slot: 1 },
          ],
        };

        return of(basicDetail);
      })
    );
  }

  // Garantizar que la caché local tenga al menos la semilla
  private ensureSeedData(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem(this.STORAGE_KEY);
        if (!existing) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.initialPokemons));
        }
      }
    } catch {}
  }

  // Respaldo en localStorage
  saveLocalCache(items: PokemonCardItem[]): void {
    try {
      if (typeof localStorage !== 'undefined' && items.length > 0) {
        const existing = this.getLocalCache();
        const map = new Map<number, PokemonCardItem>();
        for (const item of existing) map.set(item.id, item);
        for (const item of items) map.set(item.id, item);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(map.values())));
      }
    } catch (e) {
      console.warn('Error al guardar en localStorage:', e);
    }
  }

  getLocalCache(): PokemonCardItem[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {}
    return this.initialPokemons;
  }

  // Extraer ID de la URL oficial de PokeAPI (ej. https://pokeapi.co/api/v2/pokemon/25/)
  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return Number(lastPart) || 1;
  }

  // URL del artwork oficial de alta definición
  getArtworkUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  // URL del sprite clásico (fallback)
  getSpriteUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  // Tipos aproximados de respaldo para pokémon sin detalle aún
  private guessType(id: number): string {
    if ([1, 2, 3, 43, 44, 45].includes(id)) return 'grass';
    if ([4, 5, 6, 37, 38, 58, 59].includes(id)) return 'fire';
    if ([7, 8, 9, 54, 55, 60, 61, 62].includes(id)) return 'water';
    if ([25, 26, 100, 101, 125].includes(id)) return 'electric';
    if ([10, 11, 12, 13, 14, 15].includes(id)) return 'bug';
    if ([63, 64, 65, 150, 151].includes(id)) return 'psychic';
    if ([92, 93, 94].includes(id)) return 'ghost';
    if ([147, 148, 149].includes(id)) return 'dragon';
    return 'normal';
  }

  // Colores temáticos por tipo de Pokémon
  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      normal: '#94a3b8',
      fire: '#f97316',
      water: '#3b82f6',
      electric: '#eab308',
      grass: '#22c55e',
      ice: '#06b6d4',
      fighting: '#ef4444',
      poison: '#a855f7',
      ground: '#d97706',
      flying: '#38bdf8',
      psychic: '#ec4899',
      bug: '#84cc16',
      rock: '#78716c',
      ghost: '#6366f1',
      dragon: '#7c3aed',
      dark: '#334155',
      steel: '#64748b',
      fairy: '#f472b6',
    };
    return colors[type.toLowerCase()] || '#6b7280';
  }
}
