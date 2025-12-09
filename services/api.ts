/**
 * Legacy API client - maintained for backward compatibility
 * New code should use src/infrastructure/api/client.ts
 */
import apiClient from '../src/infrastructure/api/client';

// Export the new API client as default for backward compatibility
export default apiClient;

// Re-export for convenience
export { apiClient };
