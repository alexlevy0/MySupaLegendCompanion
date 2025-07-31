describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test basic JavaScript functionality', () => {
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    expect(array[0]).toBe(1);
  });

  it('should test async functionality', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});