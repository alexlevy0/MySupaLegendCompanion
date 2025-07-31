export const createClient = jest.fn(() => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id', 
            email: 'test@example.com' 
          },
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
            user: {
              id: 'test-user-id',
              email: 'test@example.com'
            }
          }
        },
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: { 
            id: 'new-user-id', 
            email: 'newuser@example.com' 
          },
          session: null
        },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn((callback) => {
        // Simuler un changement d'état d'auth si nécessaire
        return {
          data: { 
            subscription: { 
              unsubscribe: jest.fn() 
            } 
          }
        };
      }),
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {}
          }
        },
        error: null
      }),
    },
    from: jest.fn((table) => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        containedBy: jest.fn().mockReturnThis(),
        filter: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => {
          resolve({ data: [], error: null });
        }),
        // Pour permettre await
        catch: jest.fn(),
        finally: jest.fn(),
      };
      
      // Override pour des tables spécifiques
      if (table === 'profiles') {
        queryBuilder.then = jest.fn((resolve) => {
          resolve({
            data: [{
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            }],
            error: null
          });
        });
      }
      
      return queryBuilder;
    }),
    channel: jest.fn((channelName) => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        if (callback) callback('subscribed');
        return { unsubscribe: jest.fn() };
      }),
      unsubscribe: jest.fn(),
    })),
    storage: {
      from: jest.fn((bucket) => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'test/path/file.jpg' },
          error: null
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null
        }),
        getPublicUrl: jest.fn((path) => ({
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` }
        })),
        remove: jest.fn().mockResolvedValue({
          data: {},
          error: null
        }),
        list: jest.fn().mockResolvedValue({
          data: [],
          error: null
        }),
      })),
    },
    rpc: jest.fn().mockResolvedValue({
      data: {},
      error: null
    }),
  };
  
  return mockSupabase;
});

// Helper pour configurer des réponses spécifiques dans les tests
export const mockSupabaseResponse = (table, method, response) => {
  const client = createClient();
  const queryBuilder = client.from(table);
  queryBuilder[method].mockImplementation(() => {
    queryBuilder.then = jest.fn((resolve) => {
      resolve(response);
    });
    return queryBuilder;
  });
  return client;
};