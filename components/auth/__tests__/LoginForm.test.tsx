import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginForm from '../LoginForm';
import { signInWithEmail } from '@/utils/SupaLegend';

// Mock les modules
jest.mock('@/utils/SupaLegend', () => ({
  signInWithEmail: jest.fn(),
}));

describe('LoginForm', () => {
  const mockOnToggleMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Alert.alert directement
    if (Alert && !Alert.alert) {
      Alert.alert = jest.fn();
    } else if (Alert && Alert.alert && typeof Alert.alert !== 'function') {
      Alert.alert = jest.fn();
    }
    // Alert is already mocked in jest.setup.js
  });

  it('should render correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    expect(getByText('Connexion')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText('Se connecter')).toBeTruthy();
    expect(getByText("Pas encore de compte ?")).toBeTruthy();
  });

  it('should update email and password fields', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should show error alert when fields are empty', async () => {
    const { getByText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Veuillez remplir tous les champs'
      );
    });
  });

  it('should show error alert when only email is filled', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Veuillez remplir tous les champs'
      );
    });
  });

  it('should call signInWithEmail on successful form submission', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({});
    
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Connexion réussie !');
    });
  });

  it('should show error alert on login failure', async () => {
    const errorMessage = 'Invalid email or password';
    (signInWithEmail as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { getByText, getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur de connexion', errorMessage);
    });
  });

  it('should show loading state during login', async () => {
    (signInWithEmail as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { getByText, getByPlaceholderText, queryByTestId } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Mot de passe');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByText('Se connecter');
    fireEvent.press(loginButton);

    // Vérifier que le bouton est désactivé pendant le chargement
    expect(loginButton.props.disabled).toBe(true);
  });

  describe('Demo accounts', () => {
    it('should fill admin demo account', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onToggleMode={mockOnToggleMode} />
      );

      const adminButton = getByText('Admin');
      fireEvent.press(adminButton);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Mot de passe');

      expect(emailInput.props.value).toBe('admin@mycompanion.fr');
      expect(passwordInput.props.value).toBe('demo123');
    });

    it('should fill family demo account', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onToggleMode={mockOnToggleMode} />
      );

      const familyButton = getByText('Famille');
      fireEvent.press(familyButton);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Mot de passe');

      expect(emailInput.props.value).toBe('marie.dubois@gmail.com');
      expect(passwordInput.props.value).toBe('demo123');
    });

    it('should fill senior demo account', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onToggleMode={mockOnToggleMode} />
      );

      const seniorButton = getByText('Senior');
      fireEvent.press(seniorButton);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Mot de passe');

      expect(emailInput.props.value).toBe('suzanne.demo@senior.fr');
      expect(passwordInput.props.value).toBe('demo123');
    });

    it('should fill SAAD demo account', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onToggleMode={mockOnToggleMode} />
      );

      const saadButton = getByText('SAAD');
      fireEvent.press(saadButton);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Mot de passe');

      expect(emailInput.props.value).toBe('saad.lyon@saad.fr');
      expect(passwordInput.props.value).toBe('demo123');
    });
  });

  it('should call onToggleMode when "Créer un compte" is pressed', () => {
    const { getByText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const createAccountButton = getByText('Créer un compte');
    fireEvent.press(createAccountButton);

    expect(mockOnToggleMode).toHaveBeenCalled();
  });

  it('should have password input with secure text entry', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const passwordInput = getByPlaceholderText('Mot de passe');
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('should have email input with correct keyboard type', () => {
    const { getByPlaceholderText } = render(
      <LoginForm onToggleMode={mockOnToggleMode} />
    );

    const emailInput = getByPlaceholderText('Email');
    expect(emailInput.props.keyboardType).toBe('email-address');
    expect(emailInput.props.autoCapitalize).toBe('none');
  });
});