import { GuestActor } from '../actors/guest.actor';

export interface TextFieldInput {
  name: string | RegExp;
  value: string;
}

export const fillTextFields =
  (fields: TextFieldInput[]) =>
  async (actor: GuestActor): Promise<void> => {
    for (const field of fields) {
      await actor.browse.page.getByRole('textbox', { name: field.name }).fill(field.value);
    }
  };
