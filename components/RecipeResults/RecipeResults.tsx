'use client';

import { useEffect, useState } from 'react';
import { IconBookmark, IconBookmarkFilled } from '@tabler/icons-react';
import { ActionIcon, Badge, Card, Group, Image, Text, Tooltip } from '@mantine/core';
import classes from './RecipeResults.module.css';

interface Recipe {
  id: number;
  title: string;
  image: string;
  sourceUrl: string;
  readyInMinutes?: number;
  servings?: number;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  veryHealthy?: boolean;
  aggregateLikes?: number;
  healthScore?: number;
}

interface RecipeResultsProps {
  recipes: Recipe[];
}

export function RecipeResults({ recipes }: RecipeResultsProps) {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  // Load saved recipes from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedRecipes');
      if (saved) {
        setSavedRecipes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      setSavedRecipes([]);
    }
  }, []);

  // Listen for storage changes to sync across components
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('savedRecipes');
        if (saved) {
          setSavedRecipes(JSON.parse(saved));
        } else {
          setSavedRecipes([]);
        }
      } catch (error) {
        console.error('Error handling storage change:', error);
        setSavedRecipes([]);
      }
    };

    const handleSavedRecipesChanged = (event: CustomEvent) => {
      setSavedRecipes(event.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedRecipesChanged', handleSavedRecipesChanged as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedRecipesChanged', handleSavedRecipesChanged as EventListener);
    };
  }, []);

  const isRecipeSaved = (recipeId: number) => {
    return savedRecipes.some((recipe) => recipe.id === recipeId);
  };

  const toggleSaveRecipe = (recipe: Recipe) => {
    const newSavedRecipes = isRecipeSaved(recipe.id)
      ? savedRecipes.filter((r) => r.id !== recipe.id)
      : [...savedRecipes, recipe];

    setSavedRecipes(newSavedRecipes);
    localStorage.setItem('savedRecipes', JSON.stringify(newSavedRecipes));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('savedRecipesChanged', {
        detail: newSavedRecipes,
      })
    );
  };

  if (!recipes || recipes.length === 0) {
    return (
      <Text c="dimmed" ta="center" size="lg" maw={580} mx="auto" mt="xl">
        No recipes found. Try adjusting your search criteria.
      </Text>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: '20px' }}>
      <Text size="xl" fw={600} mb="md" ta="center">
        Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
      </Text>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {recipes.map((recipe) => (
          <Card
            key={recipe.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            component="a"
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit' }}
            className={classes.recipeCard}
          >
            <Card.Section style={{ position: 'relative' }}>
              <Image
                src={recipe.image}
                height={160}
                alt={recipe.title}
                style={{ objectFit: 'cover' }}
              />
              <Tooltip label={isRecipeSaved(recipe.id) ? 'Remove from saved' : 'Save recipe'}>
                <ActionIcon
                  variant="filled"
                  color={isRecipeSaved(recipe.id) ? 'yellow' : 'gray'}
                  size="lg"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 10,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSaveRecipe(recipe);
                  }}
                >
                  {isRecipeSaved(recipe.id) ? (
                    <IconBookmarkFilled size={16} />
                  ) : (
                    <IconBookmark size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500} size="lg" lineClamp={2}>
                {recipe.title}
              </Text>
            </Group>

            <Group gap="xs" mb="xs">
              {recipe.readyInMinutes && (
                <Badge color="blue" variant="light">
                  {recipe.readyInMinutes} min
                </Badge>
              )}
              {recipe.servings && (
                <Badge color="green" variant="light">
                  {recipe.servings} servings
                </Badge>
              )}
              {recipe.aggregateLikes && (
                <Badge color="yellow" variant="light">
                  {recipe.aggregateLikes} likes
                </Badge>
              )}
            </Group>

            <Group gap="xs">
              {recipe.vegetarian && (
                <Badge color="teal" size="sm">
                  Vegetarian
                </Badge>
              )}
              {recipe.vegan && (
                <Badge color="lime" size="sm">
                  Vegan
                </Badge>
              )}
              {recipe.glutenFree && (
                <Badge color="orange" size="sm">
                  Gluten Free
                </Badge>
              )}
              {recipe.dairyFree && (
                <Badge color="cyan" size="sm">
                  Dairy Free
                </Badge>
              )}
              {recipe.veryHealthy && (
                <Badge color="emerald" size="sm">
                  Healthy
                </Badge>
              )}
            </Group>

            <Text size="sm" c="dimmed" mt="xs">
              Click to view recipe
            </Text>
          </Card>
        ))}
      </div>
    </div>
  );
}
