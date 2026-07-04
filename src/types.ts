export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  provider: string;
  description: string;
  isGated: boolean;
  isDefault?: boolean;
}

export interface ChatConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  useEmulator: boolean;
}

export interface BackendStatus {
  hasHfToken: boolean;
  hasGeminiToken: boolean;
  defaultModel: string;
}
