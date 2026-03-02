/**
 * Unit Tests for Route Documentation Generator
 * 
 * Tests specific examples and edge cases for API route documentation generation.
 */

import { generateRouteDoc } from '../../src/generators/RouteDocGenerator';
import { RouteInfo, HTTPMethod } from '../../src/types';

describe('RouteDocGenerator', () => {
  describe('GET routes', () => {
    it('should generate documentation for a simple GET route', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/users',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 200, description: 'List of users retrieved successfully' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Retrieves users information');
      expect(jsdoc.tags?.route).toBe('GET /api/users');
      expect(jsdoc.tags?.access).toBe('public');
      expect(jsdoc.params).toHaveLength(2);
      expect(jsdoc.params?.map(p => p.name)).toEqual(['req', 'res']);
    });

    it('should document path parameters in GET routes', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/users/:id',
        middleware: [],
        requiresAuth: true,
        requestParams: {
          path: { id: 'string' }
        },
        responses: [
          { statusCode: 200, description: 'User retrieved successfully' },
          { statusCode: 404, description: 'User not found' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Retrieves users information');
      expect(jsdoc.tags?.access).toBe('protected');
      expect(jsdoc.throws).toHaveLength(1);
      expect(jsdoc.throws?.[0].type).toContain('404');
    });
  });

  describe('POST routes', () => {
    it('should generate documentation for POST route with request body', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.POST,
        path: '/api/users',
        middleware: ['authenticate', 'validate'],
        requiresAuth: true,
        requestParams: {
          body: {
            name: 'string',
            email: 'string',
            role: 'string'
          }
        },
        responses: [
          { 
            statusCode: 201, 
            description: 'User created successfully',
            schema: { id: 'string', name: 'string', email: 'string' }
          },
          { statusCode: 400, description: 'Invalid request data' },
          { statusCode: 401, description: 'Unauthorized' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Creates a new users');
      expect(jsdoc.description).toContain('Requires authentication');
      expect(jsdoc.tags?.route).toBe('POST /api/users');
      expect(jsdoc.tags?.access).toBe('protected');
      expect(jsdoc.params).toHaveLength(3); // req, res, next
      expect(jsdoc.params?.map(p => p.name)).toContain('next');
      expect(jsdoc.throws).toHaveLength(2); // 400 and 401
      expect(jsdoc.example).toBeDefined();
      expect(jsdoc.example).toContain('POST /api/users');
    });
  });

  describe('PUT routes', () => {
    it('should generate documentation for PUT route', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.PUT,
        path: '/api/users/:id',
        middleware: ['authenticate'],
        requiresAuth: true,
        requestParams: {
          path: { id: 'string' },
          body: { name: 'string', email: 'string' }
        },
        responses: [
          { statusCode: 200, description: 'User updated successfully' },
          { statusCode: 404, description: 'User not found' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Updates an existing users');
      expect(jsdoc.tags?.route).toBe('PUT /api/users/:id');
      expect(jsdoc.params).toHaveLength(3); // req, res, next
    });
  });

  describe('DELETE routes', () => {
    it('should generate documentation for DELETE route', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.DELETE,
        path: '/api/users/:id',
        middleware: ['authenticate', 'authorize'],
        requiresAuth: true,
        responses: [
          { statusCode: 204, description: 'User deleted successfully' },
          { statusCode: 403, description: 'Forbidden' },
          { statusCode: 404, description: 'User not found' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Deletes a users');
      expect(jsdoc.tags?.route).toBe('DELETE /api/users/:id');
      expect(jsdoc.throws).toHaveLength(2); // 403 and 404
    });
  });

  describe('PATCH routes', () => {
    it('should generate documentation for PATCH route', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.PATCH,
        path: '/api/users/:id/status',
        middleware: [],
        requiresAuth: false,
        requestParams: {
          body: { status: 'string' }
        },
        responses: [
          { statusCode: 200, description: 'Status updated successfully' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Partially updates a status');
      expect(jsdoc.tags?.access).toBe('public');
    });
  });

  describe('Authentication documentation', () => {
    it('should mark protected routes correctly', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/admin/settings',
        middleware: ['authenticate', 'requireAdmin'],
        requiresAuth: true,
        responses: [
          { statusCode: 200, description: 'Settings retrieved' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).toContain('Requires authentication');
      expect(jsdoc.tags?.access).toBe('protected');
    });

    it('should mark public routes correctly', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/public/health',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 200, description: 'Health check passed' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.description).not.toContain('Requires authentication');
      expect(jsdoc.tags?.access).toBe('public');
    });
  });

  describe('Error response documentation', () => {
    it('should document multiple error responses', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.POST,
        path: '/api/orders',
        middleware: [],
        requiresAuth: true,
        responses: [
          { statusCode: 201, description: 'Order created' },
          { statusCode: 400, description: 'Invalid order data' },
          { statusCode: 401, description: 'Unauthorized' },
          { statusCode: 409, description: 'Order already exists' },
          { statusCode: 500, description: 'Internal server error' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.throws).toHaveLength(4); // All error codes
      const throwTypes = jsdoc.throws?.map(t => t.type) || [];
      expect(throwTypes).toContain('HTTP400');
      expect(throwTypes).toContain('HTTP401');
      expect(throwTypes).toContain('HTTP409');
      expect(throwTypes).toContain('HTTP500');
    });

    it('should not include success responses in throws', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/data',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 200, description: 'Data retrieved' },
          { statusCode: 204, description: 'No content' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.throws).toHaveLength(0);
    });
  });

  describe('Example generation', () => {
    it('should generate example with request body', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.POST,
        path: '/api/products',
        middleware: [],
        requiresAuth: false,
        requestParams: {
          body: {
            name: 'Product Name',
            price: 99.99,
            category: 'Electronics'
          }
        },
        responses: [
          { statusCode: 201, description: 'Product created' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.example).toBeDefined();
      expect(jsdoc.example).toContain('POST /api/products');
      expect(jsdoc.example).toContain('Request body');
      expect(jsdoc.example).toContain('name');
      expect(jsdoc.example).toContain('price');
    });

    it('should generate example with response schema', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/products/:id',
        middleware: [],
        requiresAuth: false,
        responses: [
          { 
            statusCode: 200, 
            description: 'Product retrieved',
            schema: {
              id: '123',
              name: 'Product Name',
              price: 99.99
            }
          }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.example).toBeDefined();
      expect(jsdoc.example).toContain('Response (200)');
      expect(jsdoc.example).toContain('id');
      expect(jsdoc.example).toContain('name');
    });

    it('should not generate example when no body or schema', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.DELETE,
        path: '/api/items/:id',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 204, description: 'Item deleted' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.example).toBeUndefined();
    });
  });

  describe('Middleware documentation', () => {
    it('should include next parameter when middleware exists', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/data',
        middleware: ['authenticate'],
        requiresAuth: true,
        responses: [
          { statusCode: 200, description: 'Data retrieved' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.params).toHaveLength(3);
      const nextParam = jsdoc.params?.find(p => p.name === 'next');
      expect(nextParam).toBeDefined();
      expect(nextParam?.optional).toBe(true);
      expect(nextParam?.type).toBe('express.NextFunction');
    });

    it('should not include next parameter when no middleware', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/data',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 200, description: 'Data retrieved' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.params).toHaveLength(2);
      const paramNames = jsdoc.params?.map(p => p.name) || [];
      expect(paramNames).not.toContain('next');
    });
  });

  describe('Return documentation', () => {
    it('should document success response in returns', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.GET,
        path: '/api/users',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 200, description: 'Users retrieved successfully' },
          { statusCode: 500, description: 'Server error' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.returns).toBeDefined();
      expect(jsdoc.returns?.type).toBe('Promise<void>');
      expect(jsdoc.returns?.description).toContain('200');
      expect(jsdoc.returns?.description).toContain('Users retrieved successfully');
    });

    it('should handle routes with only error responses', () => {
      const routeInfo: RouteInfo = {
        method: HTTPMethod.POST,
        path: '/api/test',
        middleware: [],
        requiresAuth: false,
        responses: [
          { statusCode: 400, description: 'Bad request' },
          { statusCode: 500, description: 'Server error' }
        ]
      };

      const jsdoc = generateRouteDoc(routeInfo);

      expect(jsdoc.returns).toBeDefined();
      expect(jsdoc.returns?.type).toBe('Promise<void>');
      expect(jsdoc.returns?.description).toContain('Express response');
    });
  });
});
