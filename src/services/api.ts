import axios from 'axios';

// Jelly Belly Wiki API base
const JB_API = 'https://jellybellywikiapi.onrender.com/api';

export interface FlavorItem {
  id: number;
  name: string;
  description: string;
  image?: string;
  category?: string; // mapped from colorGroup or groupName[0]
}

export interface Paged<T> {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  items: T[];
}

const api = axios.create({ baseURL: JB_API, timeout: 15000 });

// Map bean payload to FlavorItem
function mapBeanToFlavorItem(bean: any): FlavorItem {
  return {
    id: Number(bean?.beanId ?? bean?.id ?? 0),
    name: String(bean?.flavorName ?? bean?.name ?? 'Unknown'),
    description: String(bean?.description ?? 'No description.'),
    image: bean?.imageUrl ?? bean?.image,
    category: bean?.colorGroup ?? (Array.isArray(bean?.groupName) ? bean.groupName[0] : undefined),
  };
}

export async function searchBeans(params: {
  flavorName?: string;
  pageIndex?: number;
  pageSize?: number;
}): Promise<Paged<FlavorItem>> {
  const { flavorName, pageIndex = 1, pageSize = 24 } = params;
  const res = await api.get('/beans', { params: { flavorName, pageIndex, pageSize } });
  const body = res.data as Paged<any>;
  return {
    totalCount: body?.totalCount ?? 0,
    pageSize: body?.pageSize ?? pageSize,
    currentPage: body?.currentPage ?? pageIndex,
    totalPages: body?.totalPages ?? 1,
    items: Array.isArray(body?.items) ? body.items.map(mapBeanToFlavorItem) : [],
  };
}

export async function getBean(id: number): Promise<FlavorItem | null> {
  const res = await api.get(`/beans/${id}`);
  const bean = res.data;
  if (!bean) return null;
  return mapBeanToFlavorItem(bean);
}

export interface RecipeItem {
  id: number;
  name: string;
  description?: string;
  kind: 'recipe' | 'combination';
}

export async function getRecipesByBeanName(name: string): Promise<RecipeItem[]> {
  // Recipes endpoint supports name filter; relate by including bean flavor in name
  const res = await api.get('/recipes', { params: { name } });
  const paged = res.data as Paged<any>;
  const list = Array.isArray(paged?.items) ? paged.items : Array.isArray(res.data) ? res.data : [];
  return list.map((r: any, i: number) => ({
    id: Number(r?.recipeId ?? r?.id ?? i + 1),
    name: String(r?.name ?? r?.title ?? 'Recipe'),
    description: r?.description,
    kind: 'recipe',
  }));
}

export async function getCombinationsByBeanName(name: string): Promise<RecipeItem[]> {
  // Combinations endpoint also supports name filter
  const res = await api.get('/combinations', { params: { name } });
  const paged = res.data as Paged<any>;
  const list = Array.isArray(paged?.items) ? paged.items : Array.isArray(res.data) ? res.data : [];
  return list.map((r: any, i: number) => ({
    id: Number(r?.combinationId ?? r?.id ?? i + 1),
    name: String(r?.name ?? r?.title ?? 'Combination'),
    description: r?.description,
    kind: 'combination',
  }));
}

export async function getRelatedByBeanNameSmart(name: string): Promise<RecipeItem[]> {
  const keywords = Array.from(
    new Set(
      String(name)
        .split(/\s+/)
        .map(s => s.replace(/[^a-z0-9]/gi, ''))
        .filter(Boolean)
    )
  );

  const queries: Promise<RecipeItem[]>[] = [];
  // Full name first for higher precision
  queries.push(getRecipesByBeanName(name));
  queries.push(getCombinationsByBeanName(name));
  // Keyword queries to increase recall
  for (const k of keywords) {
    queries.push(getRecipesByBeanName(k));
    queries.push(getCombinationsByBeanName(k));
  }
  const results = await Promise.allSettled(queries);
  const merged: RecipeItem[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        const key = `${item.kind}:${item.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      }
    }
  }
  return merged;
}

export default api;


