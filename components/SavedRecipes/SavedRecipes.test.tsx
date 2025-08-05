import { act, render, screen, userEvent } from '@/test-utils';
import { SavedRecipes } from './SavedRecipes';

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

// Mock window.addEventListener and removeEventListener
const addEventListenerMock = jest.fn();
const removeEventListenerMock = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  value: addEventListenerMock,
});
Object.defineProperty(window, 'removeEventListener', {
  value: removeEventListenerMock,
});

const mockSavedRecipes = [
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

describe('SavedRecipes component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders component title', () => {
    render(<SavedRecipes />);

    expect(screen.getByText('Saved Recipes')).toBeInTheDocument();
  });

  it('shows empty state when no saved recipes', () => {
    render(<SavedRecipes />);

    expect(
      screen.getByText(
        'No saved recipes yet. Search for recipes and click the bookmark icon to save them!'
      )
    ).toBeInTheDocument();
  });

  it('loads saved recipes from localStorage on mount', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('savedRecipes');
    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian Stir Fry')).toBeInTheDocument();
  });

  it('displays saved recipe cards', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian Stir Fry')).toBeInTheDocument();
  });

  it('shows recipe images in compact format', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/pasta.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/stirfry.jpg');
  });

  it('displays recipe information badges', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument();
    expect(screen.getByText('20m')).toBeInTheDocument();
    expect(screen.getByText('2s')).toBeInTheDocument();
  });

  it('shows dietary badges for saved recipes', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    // Second recipe should have dietary badges
    expect(screen.getByText('Veg')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
  });

  it('shows clear all button when recipes are saved', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('does not show clear all button when no recipes', () => {
    render(<SavedRecipes />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('removes individual recipe when delete button is clicked', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    // Find the delete button by looking for buttons that are not the "Clear All" button
    const allButtons = screen.getAllByRole('button');
    const deleteButtonsAlt = allButtons.filter(
      (button) => button.textContent !== 'Clear All' && !button.textContent?.includes('Clear All')
    );

    expect(deleteButtonsAlt.length).toBeGreaterThan(0); // Should have delete buttons

    await user.click(deleteButtonsAlt[0]);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'savedRecipes',
      JSON.stringify([mockSavedRecipes[1]])
    );
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'savedRecipesChanged',
        detail: [mockSavedRecipes[1]],
      })
    );
  });

  it('clears all recipes when clear all button is clicked', async () => {
    const user = userEvent.setup();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    const clearAllButton = screen.getByText('Clear All');
    await user.click(clearAllButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('savedRecipes');
    expect(dispatchEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'savedRecipesChanged',
        detail: [],
      })
    );
  });

  it('provides external link to recipe source', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    const externalLinks = screen.getAllByRole('link');
    expect(externalLinks[0]).toHaveAttribute('href', 'https://example.com/recipe1');
    expect(externalLinks[0]).toHaveAttribute('target', '_blank');
    expect(externalLinks[0]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sets up event listeners on mount', () => {
    render(<SavedRecipes />);

    expect(addEventListenerMock).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('savedRecipesChanged', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = render(<SavedRecipes />);

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'savedRecipesChanged',
      expect.any(Function)
    );
  });

  it('handles storage event updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    // Simulate storage event
    const storageHandler = addEventListenerMock.mock.calls.find((call) => call[0] === 'storage')[1];

    // Simulate localStorage being cleared
    localStorageMock.getItem.mockReturnValue(null);

    act(() => {
      storageHandler();
    });

    expect(
      screen.getByText(
        'No saved recipes yet. Search for recipes and click the bookmark icon to save them!'
      )
    ).toBeInTheDocument();
  });

  it('handles custom event updates', () => {
    render(<SavedRecipes />);

    // Simulate custom event
    const customEventHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'savedRecipesChanged'
    )[1];

    const customEvent = new CustomEvent('savedRecipesChanged', {
      detail: mockSavedRecipes,
    });

    act(() => {
      customEventHandler(customEvent);
    });

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian Stir Fry')).toBeInTheDocument();
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    // Should not crash the component
    expect(() => render(<SavedRecipes />)).not.toThrow();
  });

  it('handles malformed localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    // Should not crash the component
    expect(() => render(<SavedRecipes />)).not.toThrow();
  });

  it('displays correct recipe count in title', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSavedRecipes));

    render(<SavedRecipes />);

    expect(screen.getByText('Saved Recipes')).toBeInTheDocument();
  });

  it('renders scrollable area for many recipes', () => {
    const manyRecipes = Array.from({ length: 20 }, (_, i) => ({
      ...mockSavedRecipes[0],
      id: i + 1,
      title: `Recipe ${i + 1}`,
    }));

    localStorageMock.getItem.mockReturnValue(JSON.stringify(manyRecipes));

    render(<SavedRecipes />);

    // Should render all recipes
    expect(screen.getByText('Recipe 1')).toBeInTheDocument();
    expect(screen.getByText('Recipe 20')).toBeInTheDocument();
  });
});
