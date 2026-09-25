import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newList, addIngredients, localShareService, listRepository, stepQuantity } from '../js/domain.js';

test('quantity arrows change by one without locale or fractional step jumps', () => {
  assert.equal(stepQuantity(1, 1), 2);
  assert.equal(stepQuantity(2, -1), 1);
  assert.equal(stepQuantity(999, 1), 1000);
  assert.equal(stepQuantity(0.5, 1), 1.5);
  assert.equal(stepQuantity(1.5, -1), 0.5);
  assert.equal(stepQuantity(1, -1), 1);
  assert.equal(stepQuantity(NaN, 1), 1);
  assert.equal(stepQuantity(1000000, 1), 1000000);
});

test('shared Unicode data round trips and import produces independent ACTIVE unchecked items', () => {
  const original = { ...newList('Churrasco 🥩'), status: 'COMPLETED', items: [{ id: 'original-item', name: 'Pão de alho', quantity: 2, unit: 'unidade', category: 'Padaria', purchased: true }] };
  const payload = localShareService.decode(localShareService.encode(original, 'João'));
  assert.equal(payload.owner, 'João');
  const imported = localShareService.import(payload);
  assert.notEqual(imported.id, original.id);
  assert.notEqual(imported.items[0].id, original.items[0].id);
  assert.equal(imported.status, 'ACTIVE');
  assert.equal(imported.items[0].purchased, false);
  assert.equal(imported.items[0].name, 'Pão de alho');
  imported.items[0].quantity = 99;
  assert.equal(original.items[0].quantity, 2);
});
test('rejects malformed, excessive and untrusted share payloads', () => {
  for (const bad of ['', '%%%', 'abc', 'a'.repeat(24001)]) assert.throws(() => localShareService.decode(bad));
  for (const quantity of [-1, 0, Infinity, '1']) assert.throws(() => localShareService.encode({name:'Teste', items:[{name:'Ovo',quantity,unit:'unidade',category:'Mercearia'}]}));
  assert.throws(() => localShareService.encode({name:'Teste',items:Array(151).fill({name:'Ovo',quantity:1,unit:'unidade',category:'Mercearia'})}));
});
test('sum, add and skip duplicate choices preserve original list and handle different units', () => {
  const list = { ...newList('Semana'), items: [{id:'old',name:'Cebola',quantity:2,unit:'unidade',category:'Hortifruti',purchased:true}] };
  const ingredient = {id:'cebola',name:'cebola',quantity:1,unit:'unidade',category:'Hortifruti'};
  const sum = addIngredients(list,[ingredient],{cebola:'sum'});
  assert.equal(sum.items.length,1); assert.equal(sum.items[0].quantity,3); assert.equal(sum.items[0].purchased,false);
  assert.equal(list.items[0].quantity,2);
  assert.equal(addIngredients(list,[ingredient],{cebola:'add'}).items.length,2);
  assert.deepEqual(addIngredients(list,[ingredient],{cebola:'skip'}),list);
  assert.equal(addIngredients(list,[{...ingredient,unit:'g'}],{cebola:'sum'}).items.length,2);
});
test('local repository persists and rejects corrupt data without replacing it', () => {
  const store = new Map(); globalThis.localStorage = {getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
  const list = newList('Compra');
  const draft = { ...newList('Em preparação'), status: 'DRAFT' };
  listRepository.save([list, draft]); assert.deepEqual(listRepository.load(),[list, draft]);
  const created = { ...draft, status: 'ACTIVE' };
  listRepository.save([list, created]); assert.deepEqual(listRepository.load(), [list, created]);
  localStorage.setItem('marketlist.lists.v1','{}'); assert.throws(()=>listRepository.load()); assert.equal(localStorage.getItem('marketlist.lists.v1'),'{}');
});
test('twenty-four recipes cover all categories and reference user-supplied JPG images', async () => {
  const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url)));
  assert.equal(recipes.length,24); assert.equal(new Set(recipes.map(recipe=>recipe.id)).size,recipes.length);
  assert.equal(new Set(recipes.map(recipe=>recipe.category)).size,8);
  for (const recipe of recipes) {
    assert.ok(recipe.instructions.length); assert.ok(recipe.ingredients.length);
    assert.equal(new Set(recipe.ingredients.map(item=>item.id)).size,recipe.ingredients.length);
    assert.match(recipe.image, /^img\/[a-z0-9-]+\.jpg$/);
    for (const item of recipe.ingredients) { assert.ok(item.quantity > 0); assert.ok(item.unit); assert.ok(item.category); }
    assert.equal(addIngredients(newList('Teste'),recipe.ingredients).items.length,recipe.ingredients.length);
  }
});
