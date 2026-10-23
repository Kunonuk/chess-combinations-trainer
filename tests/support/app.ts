import { fireEvent, screen } from '@testing-library/react';

export function moveInStudy(from: string, to: string) {
  fireEvent.click(screen.getByTestId('square-' + from));
  fireEvent.click(screen.getByTestId('square-' + to));
}

export function uploadStudyJSON(raw: string) {
  const file = new File([raw], 'test-pack.json', { type: 'application/json' });
  fireEvent.change(screen.getByLabelText('Import verified private pack'), {
    target: { files: [file] },
  });
}
