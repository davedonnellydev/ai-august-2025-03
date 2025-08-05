'use client';

import { useEffect, useState } from 'react';
import { IconBookmarkFilled, IconExternalLink, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Image,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import classes from './SavedRecipes.module.css';

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

export function SavedRecipes() {
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

  const removeRecipe = (recipeId: number) => {
    const newSavedRecipes = savedRecipes.filter((recipe) => recipe.id !== recipeId);
    setSavedRecipes(newSavedRecipes);
    localStorage.setItem('savedRecipes', JSON.stringify(newSavedRecipes));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('savedRecipesChanged', {
        detail: newSavedRecipes,
      })
    );
  };

  const clearAllRecipes = () => {
    setSavedRecipes([]);
    localStorage.removeItem('savedRecipes');

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('savedRecipesChanged', {
        detail: [],
      })
    );
  };

  return (
    <div className={classes.container}>
      <Stack gap="md" p="md">
        <Group justify="space-between" align="center">
          <Title order={3} size="h4">
            <IconBookmarkFilled size={20} style={{ marginRight: 8 }} />
            Saved Recipes
          </Title>
          {savedRecipes.length > 0 && (
            <Button variant="subtle" color="red" size="xs" onClick={clearAllRecipes}>
              Clear All
            </Button>
          )}
        </Group>

        {savedRecipes.length === 0 ? (
          <Text c="dimmed" ta="center" size="sm">
            No saved recipes yet. Search for recipes and click the bookmark icon to save them!
          </Text>
        ) : (
          <ScrollArea h={600} type="auto">
            <Stack gap="sm">
              {savedRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  shadow="xs"
                  padding="sm"
                  radius="md"
                  withBorder
                  className={classes.savedRecipeCard}
                >
                  <Group gap="sm" align="flex-start">
                    <Image
                      src={recipe.image}
                      width={60}
                      height={60}
                      alt={recipe.title}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={500} size="sm" lineClamp={2} mb={4}>
                        {recipe.title}
                      </Text>

                      <Group gap={4} mb={4}>
                        {recipe.readyInMinutes && (
                          <Badge color="blue" variant="light" size="xs">
                            {recipe.readyInMinutes}m
                          </Badge>
                        )}
                        {recipe.servings && (
                          <Badge color="green" variant="light" size="xs">
                            {recipe.servings}s
                          </Badge>
                        )}
                        {recipe.vegetarian && (
                          <Badge color="teal" size="xs">
                            Veg
                          </Badge>
                        )}
                        {recipe.vegan && (
                          <Badge color="lime" size="xs">
                            Vegan
                          </Badge>
                        )}
                      </Group>
                    </div>

                    <Group gap={4}>
                      <Tooltip label="View recipe">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          component="a"
                          href={recipe.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternalLink size={14} />
                        </ActionIcon>
                      </Tooltip>

                      <Tooltip label="Remove from saved">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => removeRecipe(recipe.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </div>
  );
}
