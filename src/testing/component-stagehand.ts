import { ComponentFixture } from '@angular/core/testing';

/**
 * Simula Stagehand para tests unitarios Angular.
 * Interpreta instrucciones en lenguaje natural y actúa sobre
 * el DOM del ComponentFixture.
 */
export class ComponentStagehand<T> {
  constructor(private readonly fixture: ComponentFixture<T>) {}

  private get nativeElement(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  private get debugElement() {
    return this.fixture.debugElement;
  }

  /**
   * Ejecuta una acción interpretando la instrucción en lenguaje natural.
   */
  async act(instruction: string): Promise<void> {
    const lower = instruction.toLowerCase();

    if (lower.includes('type ') && lower.includes(' in the ')) {
      const match = instruction.match(/type ['"]?([^'"]+)['"]? in the (.+?) field/i);
      if (match) {
        const [, value, fieldDesc] = match;
        const input = this.findInput(fieldDesc);
        if (!input) throw new Error(`No se encontró input para: ${fieldDesc}`);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    } else if (lower.includes('type ')) {
      const match = instruction.match(/type ['"]?([^'"]+)['"]?(?: in .+)?$/i);
      if (match) {
        const focused = this.nativeElement.querySelector('input:focus, textarea:focus') as HTMLInputElement | null;
        if (focused) {
          focused.value = match[1];
          focused.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          const firstInput = this.nativeElement.querySelector('input, textarea') as HTMLInputElement | null;
          if (firstInput) {
            firstInput.value = match[1];
            firstInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    }

    if (lower.includes('click ') && lower.includes(' button')) {
      const match = instruction.match(/click (?:the )?(.+?) button/i);
      const btnText = match ? match[1] : '';
      const button = this.findButton(btnText);
      if (button) {
        button.click();
        button.dispatchEvent(new Event('click', { bubbles: true }));
      }
    } else if (lower.includes('click ')) {
      const text = instruction.replace(/click (?:the )?/i, '').trim();
      const el = this.findByText(text);
      if (el) {
        el.click();
        el.dispatchEvent(new Event('click', { bubbles: true }));
      }
    }

    if (lower.includes('select ') && lower.includes(' option ')) {
      const match = instruction.match(/select ['"]?([^'"]+)['"]? option/i);
      if (match) {
        const text = match[1];
        const options = Array.from(this.nativeElement.querySelectorAll('option'));
        const opt = options.find((o) => o.textContent?.toLowerCase().includes(text.toLowerCase()));
        if (opt) {
          const select = opt.closest('select') as HTMLSelectElement | null;
          if (select) {
            select.value = (opt as HTMLOptionElement).value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    }

    this.fixture.detectChanges();
    await this.fixture.whenStable();
    return Promise.resolve();
  }

  /**
   * Extrae texto o datos del DOM según la instrucción.
   */
  async extract(instruction: string): Promise<string> {
    const lower = instruction.toLowerCase();
    let result = '';

    if (lower.includes('success message') || lower.includes('mensaje de éxito')) {
      const alerts = this.nativeElement.querySelectorAll('.alert-success, .alert.alert-success, [class*="success"]');
      for (const alert of Array.from(alerts)) {
        const text = this.getText(alert);
        if (text) return text;
      }
    }

    if (lower.includes('error message') || lower.includes('mensaje de error') || lower.includes('error alert')) {
      const alerts = this.nativeElement.querySelectorAll('.alert-error, .alert.alert-error, [class*="error"]');
      for (const alert of Array.from(alerts)) {
        const text = this.getText(alert);
        if (text) return text;
      }
    }

    if (lower.includes('title') || lower.includes('título')) {
      const h1 = this.nativeElement.querySelector('h1');
      if (h1) return this.getText(h1) || '';
      const h2 = this.nativeElement.querySelector('h2');
      if (h2) return this.getText(h2) || '';
      const title = this.nativeElement.querySelector('[class*="title"]');
      if (title) return this.getText(title) || '';
    }

    if (lower.includes('empty state') || lower.includes('estado vacío') || lower.includes('vacío')) {
      const empties = this.nativeElement.querySelectorAll('.empty-state, .empty-title, .empty-subtitle');
      for (const el of Array.from(empties)) {
        const text = this.getText(el);
        if (text) return text;
      }
    }

    if (lower.includes('list') || lower.includes('lista') || lower.includes('items')) {
      const items = this.nativeElement.querySelectorAll('.report-card, .list-item, tr, li');
      return Array.from(items)
        .map((el) => this.getText(el))
        .filter(Boolean)
        .join('\n');
    }

    if (lower.includes('validation')) {
      const errors = this.nativeElement.querySelectorAll('.field-error, [class*="error"]');
      for (const el of Array.from(errors)) {
        const text = this.getText(el);
        if (text) return text;
      }
    }

    const anyText = this.getText(this.nativeElement);
    return anyText || '';
  }

  /**
   * Observa la página y devuelve elementos que coincidan con la instrucción.
   */
  async observe(instruction: string): Promise<Array<{ element: string; description: string }>> {
    const lower = instruction.toLowerCase();
    let selector = 'input, button, a, textarea, select, h1, h2, h3, label, .alert, app-button';

    if (lower.includes('link') || lower.includes('enlace')) selector = 'a, [routerLink]';
    if (lower.includes('button') || lower.includes('botón')) selector = 'button, [role="button"], app-button';
    if (lower.includes('input') || lower.includes('campo')) selector = 'input, textarea, select';
    if (lower.includes('alert') || lower.includes('mensaje')) selector = '.alert, [role="alert"]';

    const elements = Array.from(this.nativeElement.querySelectorAll(selector));
    return elements.map((el) => {
      const htmlEl = el as HTMLElement;
      const tag = htmlEl.tagName.toLowerCase();
      const text = this.getText(htmlEl) || (htmlEl as HTMLInputElement).placeholder || '';
      const id = htmlEl.id ? `#${htmlEl.id}` : '';
      const cls = htmlEl.className && typeof htmlEl.className === 'string' ? `.${htmlEl.className.split(' ')[0]}` : '';
      return {
        element: `${tag}${id}${cls}`,
        description: text || `${tag} element`,
      };
    });
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private getText(el: Element | null): string {
    if (!el) return '';
    const text = (el as HTMLElement).innerText ?? (el as HTMLElement).textContent ?? '';
    return text.trim();
  }

  private findInput(desc: string): HTMLInputElement | HTMLTextAreaElement | null {
    const labels = this.nativeElement.querySelectorAll('label');
    for (const label of Array.from(labels)) {
      const text = this.getText(label).toLowerCase();
      if (text.includes(desc.toLowerCase())) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          const el = this.nativeElement.querySelector(`#${forAttr}`);
          if (el) return el as HTMLInputElement;
        }
        const input = label.querySelector('input, textarea') as HTMLInputElement | null;
        if (input) return input;
      }
    }

    const inputs = this.nativeElement.querySelectorAll('input, textarea');
    for (const input of Array.from(inputs)) {
      const el = input as HTMLInputElement;
      const ph = el.placeholder?.toLowerCase() || '';
      const id = el.id?.toLowerCase() || '';
      const name = el.name?.toLowerCase() || '';
      const formControlName = el.getAttribute('formControlName')?.toLowerCase() || '';
      if (
        ph.includes(desc.toLowerCase()) ||
        id.includes(desc.toLowerCase()) ||
        name.includes(desc.toLowerCase()) ||
        formControlName.includes(desc.toLowerCase())
      ) {
        return el;
      }
    }

    return null;
  }

  private findButton(textHint: string): HTMLElement | null {
    // Buscar botones nativos
    const buttons = this.nativeElement.querySelectorAll('button, [role="button"], app-button');
    for (const btn of Array.from(buttons)) {
      const el = btn as HTMLElement;
      const text = this.getText(el).toLowerCase();
      const title = el.title?.toLowerCase() || '';
      if (text.includes(textHint.toLowerCase()) || title.includes(textHint.toLowerCase())) {
        return el;
      }
    }
    return this.nativeElement.querySelector('button, app-button') as HTMLElement | null;
  }

  private findByText(text: string): HTMLElement | null {
    const all = this.nativeElement.querySelectorAll('*');
    for (const el of Array.from(all)) {
      const htmlEl = el as HTMLElement;
      if (this.getText(htmlEl).toLowerCase().includes(text.toLowerCase())) {
        return htmlEl;
      }
    }
    return null;
  }
}

/**
 * Factory rápida para crear un ComponentStagehand.
 */
export function createComponentStagehand<T>(fixture: ComponentFixture<T>): ComponentStagehand<T> {
  return new ComponentStagehand(fixture);
}
