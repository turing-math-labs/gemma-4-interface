import { ModelPreset } from "./types";

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "gemma-4-E2B",
    name: "gemma-4-E2B (Requested)",
    provider: "Google (HuggingFace)",
    description: "The requested gemma-4-E2B model.",
    isGated: true,
    isDefault: true,
  },
  {
    id: "google/gemma-2-2b-it",
    name: "Gemma 2 2B Instruct",
    provider: "Google",
    description: "State-of-the-art small open-source model. Requires Gated Access approval.",
    isGated: true,
  },
  {
    id: "google/gemma-2-9b-it",
    name: "Gemma 2 9B Instruct",
    provider: "Google",
    description: "Powerful open-source model. Great for coding and reasoning. Requires Gated Access.",
    isGated: true,
  },
  {
    id: "Qwen/Qwen2.5-1.5B-Instruct",
    name: "Qwen 2.5 1.5B Instruct",
    provider: "Alibaba",
    description: "Extremely fast, highly capable public model. Does NOT require gated access approval (Great for instant testing!).",
    isGated: false,
  },
  {
    id: "microsoft/Phi-3-mini-4k-instruct",
    name: "Phi-3 Mini 4K Instruct",
    provider: "Microsoft",
    description: "Lightweight and efficient 3.8B parameter model. Does NOT require gated access.",
    isGated: false,
  }
];

export const SUGGESTED_PROMPTS = [
  {
    title: "Explain Coding Concept",
    prompt: "Explain how promises work in JavaScript using a simple analogy.",
    icon: "code",
  },
  {
    title: "Write a Poem",
    prompt: "Write a short, cozy poem about a cup of warm tea on a rainy afternoon.",
    icon: "feather",
  },
  {
    title: "Brainstorm Ideas",
    prompt: "Give me 5 unique names for a weekend side project about garden tracking.",
    icon: "lightbulb",
  },
  {
    title: "Analyze Text",
    prompt: "Summarize this key concept: 'Small language models run faster, cost less, and are increasingly competitive for specific, narrow workloads.'",
    icon: "book-open",
  }
];
