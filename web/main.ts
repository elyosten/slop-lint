import ru from '../rules/ru.yml';
import en from '../rules/en.yml';
import { mountDemo } from './demo';

try {
  mountDemo(document, `${ru}\n${en}`);
} catch {
  const summary = document.querySelector('#lint-summary');
  if (summary) summary.textContent = 'The demo could not start. Reload the page, or use the CLI.';
}
