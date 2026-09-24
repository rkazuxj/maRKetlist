export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
export const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function stepQuantity(value, direction) {
  const current = Number.isFinite(value) ? value : 0;
  const next = Number((current + (direction > 0 ? 1 : -1)).toFixed(3));
  if (next < 0.001) return current >= 0.001 ? current : 1;
  return Math.min(next, 1000000);
}
export const newList = name => ({ id: id(), name, status: 'ACTIVE', createdAt: new Date().toISOString(), items: [] });
export const toShoppingItem = ingredient => ({ id: id(), name: ingredient.name, quantity: ingredient.quantity ?? 1, unit: ingredient.unit || 'unidade', category: ingredient.category || 'Outros', purchased: false });
export const sameProduct = (a, b) => normalize(a.name) === normalize(b.name);
export const compatibleUnits = (a, b) => normalize(a.unit || 'unidade') === normalize(b.unit || 'unidade');
export function addIngredients(list, ingredients, choices = {}) {
  const result = structuredClone(list);
  for (const ingredient of ingredients) {
    const item = toShoppingItem(ingredient);
    const existing = result.items.find(other => sameProduct(other, item) && compatibleUnits(other, item));
    const choice = choices[ingredient.id] || 'add';
    if (choice === 'skip') continue;
    if (choice === 'sum' && existing) { existing.quantity += item.quantity; existing.purchased = false; }
    else result.items.push(item);
  }
  return result;
}
const MAX_LINK_LENGTH = 24000;
function validateShared(payload) {
  if (!payload || payload.version !== 1 || !payload.list || typeof payload.list.name !== 'string' || !payload.list.name.trim() || payload.list.name.length > 100 || !Array.isArray(payload.list.items) || payload.list.items.length > 150) throw new Error('Link de lista inválido.');
  if (payload.owner != null && (typeof payload.owner !== 'string' || payload.owner.length > 60)) throw new Error('Link de lista inválido.');
  const items = payload.list.items.map(item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100 || !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 1000000 || typeof item.unit !== 'string' || item.unit.length > 30 || typeof item.category !== 'string' || item.category.length > 50) throw new Error('O link contém produtos inválidos.');
    return { name: item.name, quantity: item.quantity, unit: item.unit, category: item.category };
  });
  return { version: 1, owner: payload.owner || '', list: { name: payload.list.name.trim(), items } };
}
// Transport boundary: replace this adapter with a remote invitation service later.
export const localShareService = {
  encode(list, owner = '') {
    const payload = validateShared({ version: 1, owner, list });
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (encoded.length > MAX_LINK_LENGTH) throw new Error('Esta lista é grande demais para compartilhar por link. Divida os produtos em listas menores.');
    return encoded;
  },
  decode(encoded) {
    if (!encoded || encoded.length > MAX_LINK_LENGTH || !/^[\w-]+$/.test(encoded)) throw new Error('Link inválido ou grande demais.');
    try {
      const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
      return validateShared(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, c => c.charCodeAt(0)))));
    } catch { throw new Error('Não foi possível abrir esta lista. O link está incompleto ou é inválido.'); }
  },
  import(payload) { const valid = validateShared(payload); return { ...newList(valid.list.name), items: valid.list.items.map(toShoppingItem) }; }
};
// Repositories keep storage and recipe sources separate from the screens.
export const listRepository = {
  load() {
    const raw = localStorage.getItem('marketlist.lists.v1');
    if (!raw) return [];
    const lists = JSON.parse(raw);
    if (!Array.isArray(lists) || lists.some(list => !list || typeof list.id !== 'string' || typeof list.name !== 'string' || !['DRAFT', 'ACTIVE', 'COMPLETED'].includes(list.status) || !Array.isArray(list.items) || list.items.some(item => !item || typeof item.id !== 'string' || typeof item.name !== 'string' || !Number.isFinite(item.quantity) || item.quantity <= 0 || typeof item.unit !== 'string' || typeof item.category !== 'string' || typeof item.purchased !== 'boolean'))) throw new Error('Dados locais inválidos.');
    return lists;
  },
  save(lists) { localStorage.setItem('marketlist.lists.v1', JSON.stringify(lists)); }
};
export const recipeRepository = { async load() { const response = await fetch(new URL('../data/recipes.json', import.meta.url)); if (!response.ok) throw new Error('Não foi possível carregar as receitas.'); return response.json(); } };
