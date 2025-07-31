# Guide des Tests - MyCompanion App

## 🧪 Infrastructure de Tests

Cette application React Native utilise Jest et React Native Testing Library pour assurer la qualité du code.

## 📦 Dépendances de Test

- **Jest** : Framework de test JavaScript
- **@testing-library/react-native** : Utilitaires de test pour React Native
- **@testing-library/jest-native** : Matchers Jest supplémentaires
- **jest-expo** : Configuration Jest optimisée pour Expo

## 🚀 Commandes de Test

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests avec couverture de code
npm run test:coverage

# Mettre à jour les snapshots
npm run test:update-snapshots
```

## 📁 Structure des Tests

```
project/
├── __mocks__/                    # Mocks globaux
│   └── @supabase/
│       └── supabase-js.js       # Mock complet de Supabase
├── jest.config.js               # Configuration Jest
├── jest.setup.js                # Configuration globale des tests
├── components/
│   ├── __tests__/               # Tests des composants principaux
│   ├── auth/__tests__/          # Tests des composants d'authentification
│   ├── admin/__tests__/         # Tests des composants admin
│   └── ui/__tests__/            # Tests des composants UI
├── hooks/__tests__/             # Tests des hooks personnalisés
└── utils/
    ├── __tests__/               # Tests des utilitaires
    └── supabase/utils/__tests__/ # Tests des utilitaires Supabase
```

## 🎯 Couverture de Tests

### Composants Testés

#### 🔐 Authentification
- **LoginForm** : Validation des formulaires, gestion des erreurs, comptes de démo
- **SignUpForm** : Inscription, validation des champs, types d'utilisateurs
- **AuthWrapper** : Gestion de l'état d'authentification, timeout de chargement

#### 👨‍💼 Administration
- **AdminDashboard** : Affichage des statistiques, navigation, rafraîchissement
- **AdminAlertCenter** : Gestion des alertes, filtres, actions sur les alertes

#### 👴 Gestion des Seniors
- **AddSeniorForm** : Formulaire multi-étapes, validation, soumission
- **EditSeniorForm** : Modification des informations, validation
- **SeniorsListScreen** : Liste, détails, actions CRUD, partage familial

#### 👤 Profil Utilisateur
- **UserProfile** : Affichage des informations, statistiques, déconnexion
- **ProfileEdit** : Modification du profil, validation
- **FamilySharingScreen** : Gestion du partage familial

#### 🎨 Composants UI
- **Button** : Variantes, états, interactions
- **LoadingSpinner** : Affichage du chargement
- **ThemedText/ThemedView** : Composants avec thème

#### 🪝 Hooks
- **useThemeColor** : Gestion des couleurs selon le thème
- **useColorScheme** : Détection du thème système

#### 🛠 Utilitaires
- **storage** : Stockage multi-plateforme (AsyncStorage/localStorage)
- **validation** : Validation des numéros de téléphone français
- **SupaLegend** : Fonctions d'authentification et de données

## 🧭 Stratégies de Test

### 1. Tests Unitaires
- Test des composants isolés avec des props mockées
- Test des hooks avec `renderHook`
- Test des fonctions utilitaires pures

### 2. Tests d'Intégration
- Test des interactions entre composants
- Test des flux de navigation
- Test de la synchronisation avec Legend State

### 3. Mocking
- **Supabase** : Mock complet du client et des méthodes
- **Expo Router** : Mock de la navigation
- **Legend State** : Mock des observables et de la réactivité
- **AsyncStorage** : Mock du stockage natif

## 📊 Seuils de Couverture

```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70
  }
}
```

## 🔧 Configuration des Mocks

### Mock Supabase
Le mock Supabase simule toutes les opérations de base de données :
- Authentification (signIn, signUp, signOut)
- Requêtes (select, insert, update, delete)
- Temps réel (channel, subscribe)
- Stockage (upload, download, getPublicUrl)

### Mock Legend State
Le mock Legend State simule la réactivité :
- Observables
- Computed values
- Synchronisation

### Mock Expo Router
Le mock simule la navigation :
- `useRouter()` pour la navigation programmatique
- `useLocalSearchParams()` pour les paramètres de route

## 🎪 Exemples de Tests

### Test de Composant
```javascript
it('should display user information', async () => {
  const { getByText } = render(<UserProfile />);
  
  await waitFor(() => {
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });
});
```

### Test de Hook
```javascript
it('should return theme color', () => {
  const { result } = renderHook(() => 
    useThemeColor({}, 'text')
  );
  
  expect(result.current).toBe('#11181C');
});
```

### Test Asynchrone
```javascript
it('should handle form submission', async () => {
  const { getByText } = render(<LoginForm />);
  
  fireEvent.press(getByText('Se connecter'));
  
  await waitFor(() => {
    expect(signInWithEmail).toHaveBeenCalled();
  });
});
```

## 🐛 Débogage des Tests

### Tests qui échouent
1. Vérifier les mocks dans `jest.setup.js`
2. Vérifier les imports et les dépendances
3. Utiliser `screen.debug()` pour voir le DOM rendu
4. Vérifier les `testID` pour les sélecteurs

### Performance
- Utiliser `beforeEach` pour réinitialiser les mocks
- Éviter les tests dépendants
- Grouper les tests similaires avec `describe`

## 🚦 CI/CD

Les tests peuvent être intégrés dans votre pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run tests
  run: npm test -- --coverage --watchAll=false
```

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)

---

## 🎯 Prochaines Étapes

1. **Tests E2E** : Ajouter Detox ou Maestro pour les tests end-to-end
2. **Tests de Performance** : Mesurer les temps de rendu et d'exécution
3. **Tests d'Accessibilité** : Vérifier l'accessibilité des composants
4. **Visual Regression** : Ajouter des tests de régression visuelle

## 🤝 Contribution

Pour ajouter de nouveaux tests :
1. Créer le fichier de test dans `__tests__` à côté du composant
2. Suivre les patterns existants
3. Vérifier la couverture avec `npm run test:coverage`
4. S'assurer que tous les tests passent avant de commit