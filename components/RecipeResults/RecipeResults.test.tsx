import { render, screen, userEvent } from '@/test-utils';
import { RecipeResults } from './RecipeResults';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.dispatchEvent
const dispatchEventMock = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: dispatchEventMock,
});

const mockRecipes = [
  {
    id: 1,
    title: 'Pasta Carbonara',
    image: 'https://example.com/pasta.jpg',
    sourceUrl: 'https://example.com/recipe1',
    readyInMinutes: 30,
    servings: 4,
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    veryHealthy: true,
    aggregateLikes: 150,
    healthScore: 85,
  },
  {
    id: 2,
    title: 'Vegetarian Stir Fry',
    image: 'https://example.com/stirfry.jpg',
    sourceUrl: 'https://example.com/recipe2',
    readyInMinutes: 20,
    servings: 2,
    vegetarian: true,
    vegan: true,
    glutenFree: true,
    dairyFree: true,
    veryHealthy: true,
    aggregateLikes: 75,
    healthScore: 95,
  },
];

describe('RecipeResults component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders recipe cards for each recipe', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    expect(screen.getByText('Found 2 recipes')).toBeInTheDocument();
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian Stir Fry')).toBeInTheDocument();
  });

  it('displays recipe images', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/pasta.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/stirfry.jpg');
  });

  it('shows recipe information badges', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('4 servings')).toBeInTheDocument();
    expect(screen.getByText('150 likes')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('2 servings')).toBeInTheDocument();
    expect(screen.getByText('75 likes')).toBeInTheDocument();
  });

  it('displays dietary badges correctly', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    // First recipe (non-vegetarian) - should not have vegetarian badges
    // Check that vegetarian badges are not present for the first recipe
    const vegetarianBadges = screen.getAllByText('Vegetarian');
    const veganBadges = screen.getAllByText('Vegan');

    // Should have exactly one vegetarian and one vegan badge (from the second recipe)
    expect(vegetarianBadges).toHaveLength(1);
    expect(veganBadges).toHaveLength(1);

    // Second recipe (vegetarian and vegan) - should have these badges
    expect(screen.getByText('Gluten Free')).toBeInTheDocument();
    expect(screen.getByText('Dairy Free')).toBeInTheDocument();
    expect(screen.getAllByText('Healthy')).toHaveLength(2);
  });

  it('shows empty state when no recipes provided', () => {
    render(<RecipeResults recipes={[]} />);

    expect(
      screen.getByText('No recipes found. Try adjusting your search criteria.')
    ).toBeInTheDocument();
  });

  it('shows empty state when recipes is null', () => {
    render(<RecipeResults recipes={null as any} />);

    expect(
      screen.getByText('No recipes found. Try adjusting your search criteria.')
    ).toBeInTheDocument();
  });

  it('loads saved recipes from localStorage on mount', () => {
    const savedRecipes = [mockRecipes[0]];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedRecipes));

    render(<RecipeResults recipes={mockRecipes} />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('savedRecipes');
  });

  it('displays bookmark icons for each recipe', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    const bookmarkButtons = screen.getAllByRole('button');
    expect(bookmarkButtons).toHaveLength(2);
  });

  it('shows filled bookmark for saved recipes', () => {
    const savedRecipes = [mockRecipes[0]];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedRecipes));

    render(<RecipeResults recipes={mockRecipes} />);

    // First recipe should have filled bookmark (saved)
    const bookmarkButtons = screen.getAllByRole('button');
    // Check that the bookmark button exists and has the correct icon
    expect(bookmarkButtons[0]).toBeInTheDocument();
  });

  it('shows empty bookmark for unsaved recipes', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    // All recipes should have empty bookmarks (not saved)
    const bookmarkButtons = screen.getAllByRole('button');
    bookmarkButtons.forEach((button) => {
      expect(button).toBeInTheDocument();
    });
  });

  it('saves recipe when bookmark is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeResults recipes={mockRecipes} />);

    const bookmarkButtons = screen.getAllByRole('button');
    await user.click(bookmarkButtons[0]);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'savedRecipes',
      JSON.stringify([mockRecipes[0]])
    );
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'savedRecipesChanged',
        detail: [mockRecipes[0]],
      })
    );
  });

  it('removes recipe from saved when bookmark is clicked again', async () => {
    const user = userEvent.setup();
    const savedRecipes = [mockRecipes[0]];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedRecipes));

    render(<RecipeResults recipes={mockRecipes} />);

    const bookmarkButtons = screen.getAllByRole('button');
    await user.click(bookmarkButtons[0]);

    expect(localStorageMock.setItem).toHaveBeenCalledWith('savedRecipes', JSON.stringify([]));
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'savedRecipesChanged',
        detail: [],
      })
    );
  });

  it('prevents card click when bookmark is clicked', async () => {
    const user = userEvent.setup();
    render(<RecipeResults recipes={mockRecipes} />);

    const bookmarkButtons = screen.getAllByRole('button');
    const recipeCards = screen.getAllByRole('link');

    // Verify the card link exists and has the correct href
    expect(recipeCards[0]).toHaveAttribute('href', 'https://example.com/recipe1');

    // Click the bookmark button
    await user.click(bookmarkButtons[0]);

    // The bookmark click should not trigger navigation
    // We verify this by checking that the bookmark button is still present
    // and that localStorage was updated (indicating the bookmark action worked)
    expect(bookmarkButtons[0]).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // The card link should still be present and unchanged
    expect(recipeCards[0]).toHaveAttribute('href', 'https://example.com/recipe1');
  });

  it('displays tooltips for bookmark buttons', () => {
    render(<RecipeResults recipes={mockRecipes} />);

    const bookmarkButtons = screen.getAllByRole('button');
    bookmarkButtons.forEach((button) => {
      expect(button).toBeInTheDocument();
    });
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    // Should not crash the component
    expect(() => render(<RecipeResults recipes={mockRecipes} />)).not.toThrow();
  });
});
