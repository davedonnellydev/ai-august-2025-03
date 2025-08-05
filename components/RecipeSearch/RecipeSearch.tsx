'use client';

import { useEffect, useState } from 'react';
import { Button, Text, TextInput } from '@mantine/core';
import { ClientRateLimiter } from '@/app/lib/utils/api-helpers';
import { RecipeResults } from '../RecipeResults/RecipeResults';

export function RecipeSearch() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingRequests, setRemainingRequests] = useState(0);

  // Update remaining requests on component mount and after translations
  useEffect(() => {
    setRemainingRequests(ClientRateLimiter.getRemainingRequests());
  }, []);

  const handleRequest = async () => {
    if (!input.trim()) {
      setError('Please enter some text to translate');
      return;
    }

    // Check rate limit before proceeding
    if (!ClientRateLimiter.checkLimit()) {
      setError('Rate limit exceeded. Please try again later.');
      setRemainingRequests(ClientRateLimiter.getRemainingRequests());
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/openai/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || 'API call failed');
      }

      const result = await response.json();
      console.log(result.response);

      // Make the Spoonacular API call
      const recipes = await fetch(`/api/proxy/spoonacular/complexSearch${result.response}`);

      if (!recipes.ok) {
        const errorData = await recipes.json();
        console.log(errorData);
        throw new Error(errorData.error || 'Spoonacular API call failed');
      }

      const recipeList = await recipes.json();

      console.log('recipe list:');
      console.log(recipeList);

      setResponse(recipeList.results);
      // Update remaining requests after successful translation
      //   setRemainingRequests(ClientRateLimiter.getRemainingRequests());
    } catch (err) {
      console.error('API error:', err);
      setError(err instanceof Error ? err.message : 'API failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setResponse([]);
    setError('');
  };

  return (
    <>
      <div style={{ maxWidth: 600, margin: '20px auto', padding: '20px' }}>
        <TextInput
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          size="md"
          radius="md"
          label="Search for recipes"
          placeholder="Find pasta recipes that use chicken and broccoli..."
        />

        <Button variant="filled" color="cyan" onClick={() => handleRequest()} loading={isLoading}>
          Search
        </Button>
        <Button variant="light" color="cyan" onClick={() => handleReset()}>
          Reset
        </Button>

        {error && (
          <Text c="red" ta="center" size="lg" maw={580} mx="auto" mt="xl">
            Error: {error}
          </Text>
        )}
      </div>

      {response && response.length > 0 && <RecipeResults recipes={response} />}

      <Text c="dimmed" ta="center" size="sm" maw={580} mx="auto" mt="xl">
        You have {remainingRequests} questions remaining.
      </Text>
    </>
  );
}
