// Google OAuth service for client-side authentication

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { code: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: {
            theme: string;
            size: string;
            text: string;
            width?: number;
            locale?: string;
          }) => void;
        };
      };
    };
  }
}

export interface GoogleAuthResponse {
  credential: string; // ID token
  select_by?: string;
}

export class GoogleAuthService {
  private clientId: string;
  private isLoaded: boolean = false;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  /**
   * Load Google Identity Services script
   */
  async loadScript(): Promise<void> {
    if (this.isLoaded || window.google) {
      this.isLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Error al cargar Google Identity Services"));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Google Sign-In and return ID token
   */
  async signIn(): Promise<string> {
    await this.loadScript();

    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error("Google Identity Services no está disponible"));
        return;
      }

      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: GoogleAuthResponse) => {
          if (response.credential) {
            resolve(response.credential);
          } else {
            reject(new Error("No se recibió el token de Google"));
          }
        },
      });

      // Prompt the user to sign in
      window.google.accounts.id.prompt();
    });
  }

  /**
   * Render Google Sign-In button
   */
  async renderButton(
    element: HTMLElement,
    config?: {
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      width?: number;
      locale?: string;
    }
  ): Promise<void> {
    await this.loadScript();

    if (!window.google?.accounts?.id) {
      throw new Error("Google Identity Services no está disponible");
    }

    window.google.accounts.id.renderButton(element, {
      theme: config?.theme || "outline",
      size: config?.size || "large",
      text: config?.text || "signin_with",
      width: config?.width,
      locale: config?.locale || "es",
    });
  }
}

// Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const googleAuthService = new GoogleAuthService(GOOGLE_CLIENT_ID);

