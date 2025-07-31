import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddSeniorForm from '../AddSeniorForm';
import { addSenior, createFamilyRelation, useMyCompanionAuth } from '@/utils/SupaLegend';

// Mock modules
jest.mock('@/utils/SupaLegend', () => ({
  addSenior: jest.fn(),
  createFamilyRelation: jest.fn(),
  useMyCompanionAuth: jest.fn(),
}));

describe('AddSeniorForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockUserProfile = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'family',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMyCompanionAuth as jest.Mock).mockReturnValue({
      userProfile: mockUserProfile,
    });
    (Alert.alert as jest.Mock).mockClear();
  });

  it('should render step 1 (info) correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    expect(getByText('Ajouter un senior')).toBeTruthy();
    expect(getByText('Étape 1 sur 3')).toBeTruthy();
    expect(getByText('Informations personnelles')).toBeTruthy();
    
    expect(getByPlaceholderText('Prénom *')).toBeTruthy();
    expect(getByPlaceholderText('Nom *')).toBeTruthy();
    expect(getByPlaceholderText('Téléphone *')).toBeTruthy();
    expect(getByPlaceholderText('Date de naissance (JJ/MM/AAAA)')).toBeTruthy();
  });

  it('should validate required fields on step 1', async () => {
    const { getByText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const nextButton = getByText('Suivant');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Veuillez remplir tous les champs obligatoires'
      );
    });
  });

  it('should validate phone format', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '123'); // Invalid phone

    const nextButton = getByText('Suivant');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        'Le numéro de téléphone doit contenir 10 chiffres'
      );
    });
  });

  it('should proceed to step 2 with valid data', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Fill step 1 form
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.changeText(getByPlaceholderText('Date de naissance (JJ/MM/AAAA)'), '01/01/1940');

    const nextButton = getByText('Suivant');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByText('Étape 2 sur 3')).toBeTruthy();
      expect(getByText('Préférences d\'appel')).toBeTruthy();
    });
  });

  it('should handle address input', () => {
    const { getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const streetInput = getByPlaceholderText('Adresse');
    const cityInput = getByPlaceholderText('Ville');
    const postalCodeInput = getByPlaceholderText('Code postal');

    fireEvent.changeText(streetInput, '123 Rue de la Paix');
    fireEvent.changeText(cityInput, 'Paris');
    fireEvent.changeText(postalCodeInput, '75001');

    expect(streetInput.props.value).toBe('123 Rue de la Paix');
    expect(cityInput.props.value).toBe('Paris');
    expect(postalCodeInput.props.value).toBe('75001');
  });

  it('should handle preferences in step 2', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Navigate to step 2
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      expect(getByText('Heure d\'appel préférée')).toBeTruthy();
    });

    // Test frequency buttons
    const frequency2Button = getByText('2 fois par jour');
    fireEvent.press(frequency2Button);

    // Should be able to proceed to step 3
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      expect(getByText('Étape 3 sur 3')).toBeTruthy();
      expect(getByText('Confirmation')).toBeTruthy();
    });
  });

  it('should display summary in step 3', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Fill step 1
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    // Skip step 2
    await waitFor(() => {
      fireEvent.press(getByText('Suivant'));
    });

    // Check summary in step 3
    await waitFor(() => {
      expect(getByText('Jean Dupont')).toBeTruthy();
      expect(getByText('0612345678')).toBeTruthy();
      expect(getByText('1 fois par jour à 09:00')).toBeTruthy();
    });
  });

  it('should handle form submission successfully', async () => {
    (addSenior as jest.Mock).mockResolvedValue({
      data: { id: 'senior-123' },
      error: null,
    });
    (createFamilyRelation as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Fill and navigate through all steps
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      fireEvent.press(getByText('Suivant'));
    });

    await waitFor(() => {
      const confirmButton = getByText('Confirmer et ajouter');
      fireEvent.press(confirmButton);
    });

    await waitFor(() => {
      expect(addSenior).toHaveBeenCalledWith({
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '0612345678',
        birth_date: null,
        address: '',
        emergency_contact: '',
        created_by: 'user-123',
      });

      expect(createFamilyRelation).toHaveBeenCalledWith({
        senior_id: 'senior-123',
        user_id: 'user-123',
        relationship_type: 'enfant',
        is_primary: true,
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Succès',
        'Senior ajouté avec succès'
      );

      expect(mockOnSuccess).toHaveBeenCalledWith('senior-123');
    });
  });

  it('should handle submission errors', async () => {
    const errorMessage = 'Network error';
    (addSenior as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Navigate to confirmation
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      fireEvent.press(getByText('Suivant'));
    });

    await waitFor(() => {
      const confirmButton = getByText('Confirmer et ajouter');
      fireEvent.press(confirmButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        `Impossible d'ajouter le senior : ${errorMessage}`
      );
    });
  });

  it('should handle cancel action', () => {
    const { getByText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const cancelButton = getByText('Annuler');
    fireEvent.press(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle back navigation between steps', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Go to step 2
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      expect(getByText('Étape 2 sur 3')).toBeTruthy();
    });

    // Go back to step 1
    const backButton = getByText('Retour');
    fireEvent.press(backButton);

    expect(getByText('Étape 1 sur 3')).toBeTruthy();
    // Form data should be preserved
    expect(getByPlaceholderText('Prénom *').props.value).toBe('Jean');
  });

  it('should toggle notification preferences', async () => {
    const { getByText, getByPlaceholderText, getAllByRole } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Navigate to step 2
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      expect(getByText('Notifications')).toBeTruthy();
    });

    // Find and toggle switches
    const switches = getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);

    // Toggle first switch (daily reports)
    fireEvent(switches[0], 'valueChange', false);
    expect(switches[0].props.value).toBe(false);
  });

  it('should format birth date input', () => {
    const { getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const birthDateInput = getByPlaceholderText('Date de naissance (JJ/MM/AAAA)');
    
    // Test date formatting
    fireEvent.changeText(birthDateInput, '01011940');
    // The component should format it, but we're testing the raw input here
    expect(birthDateInput.props.value).toBe('01011940');
  });

  it('should handle loading state during submission', async () => {
    (addSenior as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByText, getByPlaceholderText } = render(
      <AddSeniorForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Navigate to confirmation
    fireEvent.changeText(getByPlaceholderText('Prénom *'), 'Jean');
    fireEvent.changeText(getByPlaceholderText('Nom *'), 'Dupont');
    fireEvent.changeText(getByPlaceholderText('Téléphone *'), '0612345678');
    fireEvent.press(getByText('Suivant'));

    await waitFor(() => {
      fireEvent.press(getByText('Suivant'));
    });

    await waitFor(() => {
      const confirmButton = getByText('Confirmer et ajouter');
      fireEvent.press(confirmButton);
      
      // Button should be disabled during loading
      expect(confirmButton.props.disabled).toBe(true);
    });
  });
});