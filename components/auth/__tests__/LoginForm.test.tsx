import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginForm from '../LoginForm';
import { signInMyCompanionUser } from '@/utils/auth';

// Mock auth module
jest.mock('@/utils/auth', () => ({
  signInMyCompanionUser: jest.fn(),
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
    const { getByPlaceholderText, getByText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should update password input', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    const passwordInput = getByPlaceholderText('Mot de passe');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('should have secure text entry for password', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={jest.fn()} />
    );

    const passwordInput = getByPlaceholderText('Mot de passe');
    expect(passwordInput.props.secureTextEntry).toBe(true);
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
});