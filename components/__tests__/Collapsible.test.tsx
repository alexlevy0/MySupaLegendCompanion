import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Collapsible } from '../Collapsible';

// Mock des dépendances
jest.mock('@/components/ui/IconSymbol', () => ({
  IconSymbol: ({ name }: any) => `IconSymbol: ${name}`,
}));

describe('Collapsible', () => {
  it('should render with title', () => {
    const { getByText } = render(
      <Collapsible title="Test Title">
        <></>
      </Collapsible>
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('should not show content initially', () => {
    const { queryByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );

    expect(queryByText('Hidden Content')).toBeFalsy();
  });

  it('should show content when pressed', () => {
    const { getByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );

    const titleButton = getByText('Test Title');
    fireEvent.press(titleButton);

    expect(getByText('Hidden Content')).toBeTruthy();
  });

  it('should hide content when pressed twice', () => {
    const { getByText, queryByText } = render(
      <Collapsible title="Test Title">
        <Text>Hidden Content</Text>
      </Collapsible>
    );

    const titleButton = getByText('Test Title');
    
    // Ouvrir
    fireEvent.press(titleButton);
    expect(getByText('Hidden Content')).toBeTruthy();
    
    // Fermer
    fireEvent.press(titleButton);
    expect(queryByText('Hidden Content')).toBeFalsy();
  });
});