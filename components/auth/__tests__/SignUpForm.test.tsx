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

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  return {
    Picker: ({ children }: any) => React.createElement('View', null, children),
    PickerItem: () => null,
  };
});

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

    expect(getByPlaceholderText('Nom complet')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe (min. 6 caractères)')).toBeTruthy();
    expect(getByText("S'inscrire")).toBeTruthy();
  });

  it('should update name input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Nom complet');
    fireEvent.changeText(nameInput, 'John Doe');

    expect(nameInput.props.value).toBe('John Doe');
  });

  it('should update email input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'john@example.com');

    expect(emailInput.props.value).toBe('john@example.com');
  });

  it('should have email keyboard type for email input', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={jest.fn()} />
    );

    const emailInput = getByPlaceholderText('Email');
    expect(emailInput.props.keyboardType).toBe('email-address');
  });

  it('should call onToggleMode when "Se connecter" is pressed', () => {
    const mockToggleMode = jest.fn();
    const { getByText } = render(
      <SignUpForm onToggleMode={mockToggleMode} />
    );

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    expect(mockToggleMode).toHaveBeenCalled();
  });
});