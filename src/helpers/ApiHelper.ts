import { ApiConfig, RolePermissionInterface, ApiListType } from "./Interfaces";
import { ErrorHelper } from "./ErrorHelper";

export class ApiHelper {

  static apiConfigs: ApiConfig[] = [];
  static isAuthenticated = false;
  static onRequest: (url: string, requestOptions: any) => void;
  static onError: (url: string, requestOptions: any, error: any) => void;

  static getConfig(keyName: string): ApiConfig | null {
    let result: ApiConfig | null = null;
    this.apiConfigs.forEach(config => { if (config.keyName === keyName) result = config; });
    return result;
  }

  static setDefaultPermissions(jwt: string) {
    this.apiConfigs.forEach(config => {
      config.jwt = jwt;
      config.permissions = [];
    });
    this.isAuthenticated = true;
  }

  static setPermissions(keyName: string, jwt: string, permissions: RolePermissionInterface[]) {
    this.apiConfigs.forEach(config => {
      if (config.keyName === keyName) {
        config.jwt = jwt;
        config.permissions = permissions;
      }
    });
    this.isAuthenticated = true;
  }

  static clearPermissions() {
    this.apiConfigs.forEach(config => { config.jwt = ""; config.permissions = []; });
    this.isAuthenticated = false;
  }

  static async get(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = { method: "GET", headers: { Authorization: "Bearer " + config.jwt } };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async getAnonymous(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = { method: "GET" };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async post(path: string, data: any, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.jwt },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async postAnonymous(path: string, data: any, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async patch(path: string, data: any, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.jwt },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async delete(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    if (!config) throw new Error(`API configuration not found: ${apiName}`);
    const requestOptions = {
      method: "DELETE",
      headers: { Authorization: "Bearer " + config.jwt }
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  private static async fetchWithErrorHandling(url: string, requestOptions: any) {
    try {
      if (this.onRequest) this.onRequest(url, requestOptions);

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorText}`);
        if (this.onError) this.onError(url, requestOptions, error);
        throw error;
      }

      const responseText = await response.text();

      if (!responseText) return {};

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        return responseText;
      }
    } catch (error) {
      if (this.onError) this.onError(url, requestOptions, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ErrorHelper.logError("ApiHelper", `Request failed: ${url} - ${errorMessage}`);
      throw error;
    }
  }
}
