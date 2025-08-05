import { render, screen, userEvent, waitFor } from '@/test-utils';
import { RecipeSearch } from './RecipeSearch';

// Mock the ClientRateLimiter
jest.mock('../../app/lib/utils/api-helpers', () => ({
  ClientRateLimiter: {
    getRemainingRequests: jest.fn(() => 10),
    checkLimit: jest.fn(() => true),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('RecipeSearch component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders input field and buttons', () => {
    render(<RecipeSearch />);
    expect(screen.getByLabelText('Search for recipes')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('displays remaining requests count', () => {
    render(<RecipeSearch />);
    expect(screen.getByText(/You have \d+ questions remaining/)).toBeInTheDocument();
  });

  it('allows user to type in input field', async () => {
    const user = userEvent.setup();
    render(<RecipeSearch />);

    const input = screen.getByLabelText('Search for recipes');
    await user.type(input, 'pasta with chicken');

    expect(input).toHaveValue('pasta with chicken');
  });

  it('shows error when trying to submit empty input', async () => {
    const user = userEvent.setup();
    render(<RecipeSearch />);

    const submitButton = screen.getByText('Search');
    await user.click(submitButton);

    expect(screen.getByText('Error: Please enter some text to translate')).toBeInTheDocument();
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeSearch />);

    const input = screen.getByLabelText('Search for recipes');
    const resetButton = screen.getByText('Reset');

    await user.type(input, 'Test input');
    await user.click(resetButton);

    expect(input).toHaveValue('');
  });

  it('handles successful API response and displays recipes', async () => {
    const user = userEvent.setup();

    // Mock successful API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '?query=pasta&cuisine=italian' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              id: 1,
              title: 'Pasta Carbonara',
              image: 'test-image.jpg',
              sourceUrl: 'https://example.com/recipe',
              readyInMinutes: 30,
              servings: 4,
            },
          ],
        }),
      });

    render(<RecipeSearch />);

    const input = screen.getByLabelText('Search for recipes');
    const searchButton = screen.getByText('Search');

    await user.type(input, 'pasta carbonara');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Found 1 recipe')).toBeInTheDocument();
      expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    });
  });

  it('handles API error and displays error message', async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' }),
    });

    render(<RecipeSearch />);

    const input = screen.getByLabelText('Search for recipes');
    const searchButton = screen.getByText('Search');

    await user.type(input, 'pasta');
    await user.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  it('shows loading state during API call', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ response: '?query=pasta' }),
              }),
            100
          )
        )
    );

    render(<RecipeSearch />);

    const input = screen.getByLabelText('Search for recipes');
    const searchButton = screen.getByText('Search');

    await user.type(input, 'pasta');
    await user.click(searchButton);

    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });
});
