import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export async function moveInStudy(user: UserEvent, from: string, to: string) {
  await user.click(screen.getByTestId('square-' + from));
  await user.click(screen.getByTestId('square-' + to));
}

export async function uploadStudyJSON(user: UserEvent, raw: string) {
  const file = new File([raw], 'test-pack.json', { type: 'application/json' });
  await user.upload(screen.getByLabelText('Import verified private pack'), file);
}
