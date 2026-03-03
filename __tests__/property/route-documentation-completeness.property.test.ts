/**
 * Property-Based Test: API Route Documentation Completeness
 *
 * Feature: comprehensive-service-documentation
 * Property 2: API Route Documentation Completeness
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * For any API route handler, the JSDoc comment SHALL document the endpoint purpose,
 * all request parameters (path, query, body), all possible response codes and structures,
 * authentication requirements, and any side effects.
 */

import * as fc from "fast-check";
import { generateRouteDoc } from "../../src/generators/RouteDocGenerator";
import { RouteInfo, ResponseSpec, HTTPMethod } from "../../src/types";

describe("Property 2: API Route Documentation Completeness", () => {
  // Arbitrary for HTTP methods
  const httpMethodArb = fc.constantFrom(
    HTTPMethod.GET,
    HTTPMethod.POST,
    HTTPMethod.PUT,
    HTTPMethod.PATCH,
    HTTPMethod.DELETE,
  );

  // Arbitrary for API paths
  const pathSegmentArb = fc.oneof(
    fc.constantFrom("users", "posts", "comments", "products", "orders"),
    fc.string({ minLength: 1, maxLength: 10 }).map((s) => `:${s}`),
  );

  const pathArb = fc
    .array(pathSegmentArb, { minLength: 1, maxLength: 4 })
    .map((segments) => "/" + segments.join("/"));

  // Arbitrary for middleware
  const middlewareArb = fc.array(
    fc.constantFrom("authenticate", "authorize", "validate", "rateLimit"),
    { maxLength: 3 },
  );

  // Arbitrary for response specs
  const responseSpecArb: fc.Arbitrary<ResponseSpec> = fc.record({
    statusCode: fc.oneof(
      fc.constantFrom(200, 201, 204),
      fc.constantFrom(400, 401, 403, 404, 500),
    ),
    description: fc.string({ minLength: 5, maxLength: 50 }),
    schema: fc.option(fc.object(), { nil: undefined }),
  });

  // Arbitrary for request parameters
  const requestParamsArb = fc.record({
    path: fc.option(fc.dictionary(fc.string(), fc.string()), {
      nil: undefined,
    }),
    query: fc.option(fc.dictionary(fc.string(), fc.string()), {
      nil: undefined,
    }),
    body: fc.option(fc.object(), { nil: undefined }),
  });

  // Arbitrary for RouteInfo
  const routeInfoArb: fc.Arbitrary<RouteInfo> = fc.record({
    method: httpMethodArb,
    path: pathArb,
    middleware: middlewareArb,
    requiresAuth: fc.boolean(),
    requestParams: fc.option(requestParamsArb, { nil: undefined }),
    responses: fc.array(responseSpecArb, { minLength: 1, maxLength: 5 }),
  });

  it("should always generate a description for any route", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Description must exist and be non-empty
        expect(jsdoc.description).toBeDefined();
        expect(jsdoc.description.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("should always document request and response parameters", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Must document req and res parameters
        expect(jsdoc.params).toBeDefined();
        expect(jsdoc.params!.length).toBeGreaterThanOrEqual(2);

        const paramNames = jsdoc.params!.map((p) => p.name);
        expect(paramNames).toContain("req");
        expect(paramNames).toContain("res");
      }),
      { numRuns: 100 },
    );
  });

  it("should document authentication requirements in tags", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Must document access level based on auth requirement
        expect(jsdoc.tags).toBeDefined();
        expect(jsdoc.tags!.access).toBeDefined();

        if (routeInfo.requiresAuth) {
          expect(jsdoc.tags!.access).toBe("protected");
        } else {
          expect(jsdoc.tags!.access).toBe("public");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should document the route method and path", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Must document the route in tags
        expect(jsdoc.tags).toBeDefined();
        expect(jsdoc.tags!.route).toBeDefined();
        expect(jsdoc.tags!.route).toContain(routeInfo.method);
        expect(jsdoc.tags!.route).toContain(routeInfo.path);
      }),
      { numRuns: 100 },
    );
  });

  it("should document response codes and descriptions", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Must document return type
        expect(jsdoc.returns).toBeDefined();
        expect(jsdoc.returns!.type).toBeDefined();
        expect(jsdoc.returns!.description).toBeDefined();
        expect(jsdoc.returns!.description.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("should document error responses as throws", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Error responses (4xx, 5xx) should be documented in throws
        const errorResponses = routeInfo.responses.filter(
          (r) => r.statusCode >= 400,
        );

        if (errorResponses.length > 0) {
          expect(jsdoc.throws).toBeDefined();
          expect(jsdoc.throws!.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should include next parameter when middleware is present", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: If middleware exists, next parameter should be documented
        if (routeInfo.middleware && routeInfo.middleware.length > 0) {
          const paramNames = jsdoc.params!.map((p) => p.name);
          expect(paramNames).toContain("next");
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should generate examples when request/response data is available", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Helper to check if an object has meaningful content
        const hasKeys = (obj: any): boolean => {
          return obj && typeof obj === "object" && Object.keys(obj).length > 0;
        };

        // Property: Example should be present if we have meaningful body or success response schema
        const hasBody = hasKeys(routeInfo.requestParams?.body);
        const successResponse = routeInfo.responses.find(
          (r) => r.statusCode >= 200 && r.statusCode < 300,
        );
        const hasResponseSchema =
          successResponse && hasKeys(successResponse.schema);

        if (hasBody || hasResponseSchema) {
          expect(jsdoc.example).toBeDefined();
          expect(jsdoc.example!.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("should maintain consistency between route info and generated docs", () => {
    fc.assert(
      fc.property(routeInfoArb, (routeInfo) => {
        const jsdoc = generateRouteDoc(routeInfo);

        // Property: Generated docs must be consistent with input
        // Check that all error status codes are documented
        const errorStatusCodes = routeInfo.responses
          .filter((r) => r.statusCode >= 400)
          .map((r) => r.statusCode);

        if (jsdoc.throws) {
          for (const statusCode of errorStatusCodes) {
            const documented = jsdoc.throws.some((t) =>
              t.type.includes(statusCode.toString()),
            );
            expect(documented).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
