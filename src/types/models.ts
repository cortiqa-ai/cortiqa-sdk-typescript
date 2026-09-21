/**
 * Type definitions for Cortiqa AI Models.
 */

export interface ModelInfo {
  id: string;
  name?: string;
  description?: string;
  provider?: string;
  free?: boolean;
}

export interface ModelListResponse {
  success: boolean;
  data: ModelInfo[];
}
