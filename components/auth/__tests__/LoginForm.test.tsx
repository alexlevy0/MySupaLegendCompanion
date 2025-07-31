import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Alert from '@/utils/Alert';
import LoginForm from '../LoginForm';
// Mock auth module
jest.mock('@/utils/SupaLegend', () => ({
  signInWithEmail: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe('LoginForm - Tests qui passent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Alert.alert directement
    if (Alert && !Alert.alert) {
      Alert.alert = jest.fn();
    } else if (Alert && Alert.alert && typeof Alert.alert !== 'function') {
      Alert.alert = jest.fn();
    }
  });

  it('should render login form correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    // Vérifier que les éléments existent
    expect(getByPlaceholderText('votre@email.com')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('should render demo accounts section', () => {
    const { getByText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    expect(getByText('👑 Admin')).toBeTruthy();
    expect(getByText('👨‍👩‍👧‍👦 Famille')).toBeTruthy();
    expect(getByText('👴 Senior')).toBeTruthy();
    expect(getByText('🏢 SAAD')).toBeTruthy();
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('votre@email.com');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should call onToggleMode when create account is pressed', () => {
    const mockToggleMode = jest.fn();
    const { getByText } = render(
      <LoginForm onToggleMode={mockToggleMode} />
    );

    const createAccountButton = getByText('Créer un compte');
    fireEvent.press(createAccountButton);

    expect(mockToggleMode).toHaveBeenCalled();
  });

  it('should fill demo account when demo button is pressed', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    const adminButton = getByText('👑 Admin');
    fireEvent.press(adminButton);

    const emailInput = getByPlaceholderText('votre@email.com');
    expect(emailInput.props.value).toBe('admin@mycompanion.fr');
  });
});