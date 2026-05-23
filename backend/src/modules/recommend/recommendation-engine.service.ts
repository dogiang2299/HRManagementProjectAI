import { Injectable } from '@nestjs/common';

@Injectable()
export class RecommendationEngineService {
  // hàm lấy URL backend FastAPI
  private getRecommendationServiceUrl() {
    return (
      process.env.RECOMMENDATION_SERVICE_URL?.replace(/\/$/, '') ||
      'http://127.0.0.1:8000'
    );
  }

  // NestJS gọi controller/router của FastAPI, không gọi trực tiếp hàm Python
  private async callRecommendationEngine<T = any>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const baseUrl = this.getRecommendationServiceUrl();
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await response.text();
    let payload: any = null;

    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      throw new Error(
        `Recommendation engine error ${response.status}: ${
          typeof payload === 'string' ? payload : JSON.stringify(payload)
        }`,
      );
    }

    return payload as T;
  }

  public async rebuildCandidateRecommendation(candidateId: string) {
    return this.callRecommendationEngine(
      `/candidates/${candidateId}/sync-and-recommend`,
      { method: 'POST' },
    );
  }

  public async rebuildJobRecommendation(recruitmentInforId: string) {
    return this.callRecommendationEngine(
      `/jobs/${recruitmentInforId}/sync-and-recommend`,
      { method: 'POST' },
    );
  }
}