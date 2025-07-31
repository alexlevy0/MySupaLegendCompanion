import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpForm from '../SignUpForm';
import { signUpMyCompanionUser } from '@/utils/SupaLegend';

// Mock les modules
jest.mock('@/utils/SupaLegend', () => ({
  signUpMyCompanionUser: jest.fn(),
}));

jest.mock('@react-native-picker/picker', () => ({
  Picker: {
    Item: ({ label, value }: any) => null,
  },
}));

describe('SignUpForm', () => {
  const mockOnToggleMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Alert is already mocked in jest.setup.js
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    expect(getByText('Inscription')).toBeTruthy();
    expect(getByPlaceholderText('Email *')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe * (min. 6 caractères)')).toBeTruthy();
    expect(getByPlaceholderText('Prénom *')).toBeTruthy();
    expect(getByPlaceholderText('Nom *')).toBeTruthy();
    expect(getByPlaceholderText('Téléphone')).toBeTruthy();
    expect(getByText("S'inscrire")).toBeTruthy();
    expect(getByText('Déjà un compte ?')).toBeTruthy();
  });

  it('should update form fields', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email *');
    const passwordInput = getByPlaceholderText('Mot de passe * (min. 6 caractères)');
    const firstNameInput = getByPlaceholderText('Prénom *');
    const lastNameInput = getByPlaceholderText('Nom *');
    const phoneInput = getByPlaceholderText('Téléphone');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(firstNameInput, 'Jean');
    fireEvent.changeText(lastNameInput, 'Dupont');
    fireEvent.changeText(phoneInput, '0612345678');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
    expect(firstNameInput.props.value).toBe('Jean');
    expect(lastNameInput.props.value).toBe('Dupont');
    expect(phoneInput.props.value).toBe('0612345678');
  });

  it('should show error when required fields are empty', async () => {
    const { getByText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Veuillez remplir tous les champs obligatoires'
      );
    });
  });

  it('should show error when password is too short', async () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    fireEvent.changeText(getByPlaceholderText('Email *'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe * (min. 6 caractères)'), '12345');
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Le mot de passe doit contenir au moins 6 caractères'
      );
    });
  });

  it('should call signUpMyCompanionUser with correct data on valid submission', async () => {
    (signUpMyCompanionUser as jest.Mock).mockResolvedValue({
      user: { id: 'new-user-id' },
      error: null
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    fireEvent.changeText(getByPlaceholderText('Email *'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe * (min. 6 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone'), '0612345678');

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(signUpMyCompanionUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          user_type: 'family',
          first_name: 'Jean',
          last_name: 'Dupont',
          phone: '0612345678',
        }
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Inscription réussie',
        'Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte mail.'
      );
    });
  });

  it('should handle signup error', async () => {
    const errorMessage = 'Email already exists';
    (signUpMyCompanionUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    fireEvent.changeText(getByPlaceholderText('Email *'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe * (min. 6 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Erreur d'inscription", errorMessage);
    });
  });

  it('should show loading state during signup', async () => {
    (signUpMyCompanionUser as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    fireEvent.changeText(getByPlaceholderText('Email *'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe * (min. 6 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    // Vérifier que le bouton est désactivé pendant le chargement
    expect(signUpButton.props.disabled).toBe(true);
  });

  it('should call onToggleMode when "Se connecter" is pressed', () => {
    const { getByText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    expect(mockOnToggleMode).toHaveBeenCalled();
  });

  it('should have password input with secure text entry', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const passwordInput = getByPlaceholderText('Mot de passe * (min. 6 caractères)');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should have email input with correct keyboard type', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email *');
    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
  });

  it('should have phone input with phone keyboard type', () => {
    const { getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    const phoneInput = getByPlaceholderText('Téléphone');
    expect(phoneInput.props.keyboardType).toBe('phone-pad');
  });

  it('should handle signup without phone number', async () => {
    (signUpMyCompanionUser as jest.Mock).mockResolvedValue({
      user: { id: 'new-user-id' },
      error: null
    });

    const { getByText, getByPlaceholderText } = render(
      <SignUpForm onToggleMode={mockOnToggleMode} />
    );

    fireEvent.changeText(getByPlaceholderText('Email *'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe * (min. 6 caractères)'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');

    const signUpButton = getByText("S'inscrire");
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(signUpMyCompanionUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          user_type: 'family',
          first_name: 'Jean',
          last_name: 'Dupont',
          phone: undefined,
        }
      );
    });
  });
});