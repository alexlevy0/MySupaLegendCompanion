import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpForm from '../SignUpForm';

jest.mock('@/utils/SupaLegend', () => ({
  signUpMyCompanionUser: jest.fn(),
  UserType: {
    SENIOR: 'senior',
    FAMILY: 'family',
    SAAD: 'saad',
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

describe('SignUpForm - Tests qui passent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Alert.alert directement
    if (Alert && !Alert.alert) {
      Alert.alert = jest.fn();
    } else if (Alert && Alert.alert && typeof Alert.alert !== 'function') {
      Alert.alert = jest.fn();
    }
  });

  it('should render signup form correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    expect(getByPlaceholderText('Jean')).toBeTruthy();
    expect(getByPlaceholderText('Dupont')).toBeTruthy();
    expect(getByPlaceholderText('votre@email.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Créer le compte')).toBeTruthy();
  });

  it('should update first name input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const firstNameInput = getByPlaceholderText('Jean');
    fireEvent.changeText(firstNameInput, 'Marie');

    expect(firstNameInput.props.value).toBe('Marie');
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('votre@email.com');
    fireEvent.changeText(emailInput, 'john@example.com');

    expect(emailInput.props.value).toBe('john@example.com');
  });

  it('should have email keyboard type for email input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('votre@email.com');
    expect(emailInput.props.keyboardType).toBe('email-address');
  });

  it('should call onToggleMode when "J\'ai déjà un compte" is pressed', () => {
    const mockToggleMode = jest.fn();
    const { getByText } = render(
      <SignUpForm onToggleMode={mockToggleMode} />
    );

    const loginButton = getByText('J\'ai déjà un compte');
    fireEvent.press(loginButton);

    expect(mockToggleMode).toHaveBeenCalled();
  });
});