import { Cortiqa } from "../client.js";
import { ModelInfo, ModelListResponse } from "../types/models.js";

export class ModelsResource {
  private client: Cortiqa;

  constructor(client: Cortiqa) {
    this.client = client;
  }

  /**
   * List all available Cortiqa AI models.
   */
  async list(): Promise<ModelInfo[]> {
    const response = await this.client.request<ModelListResponse>("/api/v1/ai/models", {
      method: "GET",
    });
    return response.data || [];
  }
}
