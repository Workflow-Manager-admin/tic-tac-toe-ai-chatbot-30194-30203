import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders Tic Tac Toe AI header', () => {
  render(<App />);
  const title = screen.getByText(/Tic Tac Toe \(AI Chat Edition\)/i);
  expect(title).toBeInTheDocument();
});

test('chat shows welcome message and accepts user move', async () => {
  render(<App />);
  expect(screen.getByText(/I'm your Tic Tac Toe AI/i)).toBeInTheDocument();
  const input = screen.getByPlaceholderText(/Type move \(1-9\)/i);
  fireEvent.change(input, { target: { value: '1' } });
  fireEvent.submit(input.closest('form'));
  expect(await screen.findByText(/Move: 1/i)).toBeInTheDocument();
});
