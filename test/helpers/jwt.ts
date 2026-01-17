import { env, fetchMock } from "cloudflare:test";
import * as jose from "jose";

/**
 * Enable network connections to test databases.
 * Call this before any DB operations (seed, reset, queries).
 */
export function enableDbConnect(): void {
  fetchMock.activate();
  fetchMock.disableNetConnect();
  // Allow all network connections for DB operations
  // Local: WebSocket (unaffected by fetchMock anyway)
  // CI: Neon HTTP API via poolQueryViaFetch
  fetchMock.enableNetConnect();
}

/**
 * Deactivate fetchMock after DB operations.
 */
export function disableDbConnect(): void {
  fetchMock.deactivate();
}

// Generate key pair once at module load time
const keyPairPromise = (async () => {
  const { privateKey, publicKey } = await jose.generateKeyPair("RS256");

  const publicJwk = await jose.exportJWK(publicKey);
  publicJwk.kid = "test-key-1";
  publicJwk.alg = "RS256";

  return { privateKey, publicJwk };
})();

/**
 * Run a test function with JWT authentication set up.
 * Automatically handles fetchMock setup and teardown.
 *
 * @param testFn - Test function that receives a valid JWT token
 */
export async function authenticated(
  testFn: (token: string) => Promise<void>,
): Promise<void> {
  const { privateKey, publicJwk } = await keyPairPromise;

  // Setup fetchMock
  enableDbConnect();

  const jwksUrl = new URL(env.JWKS_URI);
  fetchMock
    .get(jwksUrl.origin)
    .intercept({ path: jwksUrl.pathname })
    .reply(200, { keys: [publicJwk] });

  try {
    // Create token
    const token = await new jose.SignJWT({ sub: "test-user" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key-1" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

    await testFn(token);
  } finally {
    fetchMock.assertNoPendingInterceptors();
    fetchMock.deactivate();
  }
}
