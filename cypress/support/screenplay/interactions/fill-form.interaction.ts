import { CypressTask } from '../actors/actor';

export interface TextFieldInput {
  name: string | RegExp;
  value: string;
}

/**
 * Mirrors Playwright's getByRole('textbox', { name }) behaviour.
 * Resolves the field by its associated <label> text (label[for] → #id),
 * falling back to aria-label when no label association is found.
 */
export const fillTextFields =
  (fields: TextFieldInput[]): CypressTask =>
  () => {
    for (const field of fields) {
      if (typeof field.name === 'string') {
        cy.contains('label', field.name)
          .invoke('attr', 'for')
          .then((forAttr) => {
            if (forAttr) {
              cy.get(`#${forAttr}`).clear().type(field.value);
            } else {
              cy.get(`input[aria-label="${field.name}"], textarea[aria-label="${field.name}"]`)
                .first()
                .clear()
                .type(field.value);
            }
          });
      } else {
        cy.get('label')
          .filter((_, el) => (field.name as RegExp).test(el.textContent?.trim() ?? ''))
          .first()
          .invoke('attr', 'for')
          .then((forAttr) => {
            if (forAttr) {
              cy.get(`#${forAttr}`).clear().type(field.value);
            } else {
              cy.get('input, textarea')
                .filter((_, el) => {
                  const attr = el.getAttribute('aria-label') || el.getAttribute('placeholder') || '';
                  return (field.name as RegExp).test(attr);
                })
                .first()
                .clear()
                .type(field.value);
            }
          });
      }
    }
  };
