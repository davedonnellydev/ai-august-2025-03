'use client';

import { AppShell, Burger, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { SavedRecipes } from '@/components/SavedRecipes/SavedRecipes';
import { RecipeSearch } from '../components/RecipeSearch/RecipeSearch';
import classes from './page.module.css';

export default function HomePage() {
  const [opened, { toggle }] = useDisclosure();
  return (
    <AppShell
      padding="md"
      header={{ height: 100 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

        <Title className={classes.title} order={1}>
          Recipe Finder
        </Title>
      </AppShell.Header>

      <AppShell.Navbar>
        <SavedRecipes />
      </AppShell.Navbar>

      <AppShell.Main>
        <RecipeSearch />
      </AppShell.Main>
    </AppShell>
  );
}
