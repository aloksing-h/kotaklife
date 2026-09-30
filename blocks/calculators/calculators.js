import { loadForm } from '../form/form.js';
export default async function decorate(block) {
  const form = await loadForm(block);
  if (!form) return;
}
