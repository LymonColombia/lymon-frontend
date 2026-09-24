import { Actor } from '../actors/actor';

export interface TextFieldInput {
  name: string | RegExp;
  value: string;
}

export const fillTextFields =
  (fields: TextFieldInput[]) =>
  async (actor: Actor): Promise<void> => {
    for (const field of fields) {
      await actor.browse.page.getByRole('textbox', { name: field.name }).fill(field.value);
    }
  };
