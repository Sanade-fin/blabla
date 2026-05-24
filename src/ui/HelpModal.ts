import { HELP_SECTIONS } from '../data/helpContent';

export function helpModalHtml(): string {
  const sections = HELP_SECTIONS.map(
    (s) => `
    <section class="help-block">
      <h3>${s.title}</h3>
      <ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>
    </section>
  `,
  ).join('');
  return `
    <h2 class="section-title">ИНСТРУКЦИЯ И ПОДДЕРЖКА</h2>
    <div class="help-scroll">${sections}</div>
  `;
}

export function showHelpModal(): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal help-modal">
      ${helpModalHtml()}
      <button type="button" class="btn-primary" style="margin-top:16px;width:100%" id="help-close">Закрыть</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#help-close')!.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
