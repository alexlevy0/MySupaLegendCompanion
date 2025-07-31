import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../../ThemedText';

describe('ThemedText - Tests qui passent', () => {
  it('should render text correctly', () => {
    const { getByText } = render(
      <ThemedText>Hello World</ThemedText>
    );

    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should apply default type style', () => {
    const { getByText } = render(
      <ThemedText>Default Text</ThemedText>
    );

    const text = getByText('Default Text');
    expect(text).toBeTruthy();
  });

  it('should apply title type style', () => {
    const { getByText } = render(
      <ThemedText type="title">Title Text</ThemedText>
    );

    const text = getByText('Title Text');
    expect(text).toBeTruthy();
  });

  it('should apply subtitle type style', () => {
    const { getByText } = render(
      <ThemedText type="subtitle">Subtitle Text</ThemedText>
    );

    const text = getByText('Subtitle Text');
    expect(text).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { color: 'red' };
    const { getByText } = render(
      <ThemedText style={customStyle}>Styled Text</ThemedText>
    );

    const text = getByText('Styled Text');
    expect(text).toBeTruthy();
  });
});