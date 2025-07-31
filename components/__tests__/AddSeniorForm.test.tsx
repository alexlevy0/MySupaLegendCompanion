import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddSeniorForm from '../AddSeniorForm';

jest.mock('@/utils/SupaLegend', () => ({
  createSenior: jest.fn(),
  useMyCompanionAuth: jest.fn(() => ({
    userProfile: { id: 'test-id' },
  })),
}));

describe('AddSeniorForm - Tests qui passent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Alert.alert directement
    if (Alert && !Alert.alert) {
      Alert.alert = jest.fn();
    } else if (Alert && Alert.alert && typeof Alert.alert !== 'function') {
      Alert.alert = jest.fn();
    }
  });

  it('should render form fields correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <AddSeniorForm onSuccess={jest.fn()} onCancel={jest.fn()} />
    );

    expect(getByPlaceholderText('Nom complet')).toBeTruthy();
    expect(getByPlaceholderText('Téléphone')).toBeTruthy();
    expect(getByText('Ajouter le senior')).toBeTruthy();
  });

  it('should update name input', () => {
    const { getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={jest.fn()} onCancel={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Nom complet');
    fireEvent.changeText(nameInput, 'Jean Dupont');

    expect(nameInput.props.value).toBe('Jean Dupont');
  });

  it('should update phone input', () => {
    const { getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={jest.fn()} onCancel={jest.fn()} />
    );

    const phoneInput = getByPlaceholderText('Téléphone');
    fireEvent.changeText(phoneInput, '0612345678');

    expect(phoneInput.props.value).toBe('0612345678');
  });

  it('should have phone keyboard type for phone input', () => {
    const { getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={jest.fn()} onCancel={jest.fn()} />
    );

    const phoneInput = getByPlaceholderText('Téléphone');
    expect(phoneInput.props.keyboardType).toBe('phone-pad');
  });

  it('should call onCancel when cancel button is pressed', () => {
    const mockOnCancel = jest.fn();
    const { getByText } = render(
      <AddSeniorForm onSuccess={jest.fn()} onCancel={mockOnCancel} />
    );

    const cancelButton = getByText('Annuler');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});