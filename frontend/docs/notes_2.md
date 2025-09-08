1. Organize by Feature, Not Just by Type
Group related files (screen, hooks, components, styles) by feature when possible.
Example:
'''app/
  (screens)/
    favorites.tsx
    categories.tsx
  components/
    CategoryTabs.tsx
    ProductCard.tsx
  hooks/
    useFavoriteCategoryFilter.ts
    useCategoryFilter.ts
  styles/
    commonStyles.ts
    buttons.ts
  types/
    index.ts'''
2. Use Small, Reusable Components
Break UI into small components (e.g., CategoryTabs, ProductCard).
Each component should do one thing well.
Pass data and actions via props.
3. Keep Logic Out of UI Components
Use hooks for logic (fetching, filtering, state).
UI components should only display data and handle user interaction.
4. Centralize Types
Put all interfaces/types in one place (types/index.ts).
Import types where needed for clarity and type safety.
5. Use Custom Hooks for Reusable Logic
If you repeat logic (e.g., filtering, fetching), put it in a hook.
Example: useFavoriteCategoryFilter, useCategoryFilter.
6. Consistent Naming and Structure
Name files and functions clearly (ProductCard, CategoryTabs, useFavoriteCategoryFilter).
Use consistent folder structure.
7. Keep Screens Simple
Screens should mostly handle layout and pass data/handlers to components.
Example: In favorites.tsx, use the hook to get filtered data, pass it to FlatList.
8. Use Stylesheets for Styling
Keep styles in separate files or at the bottom of your component file.
Use shared styles for common patterns.
9. Document Your Code
Add comments for complex logic.
Write a short description for custom hooks and components.
10. Learn by Refactoring
Start with working code, then refactor to extract components/hooks.
Each time you see repeated code, ask: “Can I make this a component or hook?”
'''
import { useFavoriteCategoryFilter } from "@/hooks/useFavoriteCategoryFilter";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CATEGORIES } from "@/constants/categories";
import { ProductCard } from "@/components/ProductCard";

export default function FavoritesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const filteredFavorites = useFavoriteCategoryFilter(favorites, selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <CategoryTabs
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <FlatList
        data={filteredFavorites}
        renderItem={renderFavoriteItem}
        // ...
      />
    </SafeAreaView>
  );
}
'''

Summary Table
Concept	What to do
Components	Small, reusable, UI only
Hooks	Logic, state, data fetching
Types	Centralized, imported everywhere
Styles	Shared, separate from logic
Props	Pass data/actions to components