import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders learn react text', () => {
  render(<App />);
  const elements = screen.getAllByText(/connect/i);
   expect(elements.length).toBeGreaterThan(0);
});
