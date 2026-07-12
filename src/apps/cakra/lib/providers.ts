/**
 * Empire Agent — Provider Registry
 * All free-tier AI providers with their free models
 */

import type { Provider, ModelInfo, ProviderId } from './types'

export const PROVIDERS: Record<ProviderId, Provider> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    logo: '⬡',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyLabel: 'OpenRouter API Key',
    free: true,
    color: '#0d9488',
    models: [
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B',
        contextWindow: 128_000,
        provider: 'openrouter',
        notes: 'Best overall free model',
      },
      {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral 7B',
        contextWindow: 32_000,
        provider: 'openrouter',
        notes: 'Fast, reliable',
      },
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B',
        contextWindow: 32_000,
        provider: 'openrouter',
        notes: 'Best reasoning of free models',
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        contextWindow: 200_000,
        provider: 'openrouter',
        notes: 'Fast, good at analysis',
      },
      {
        id: 'google/gemma-3-4b-it',
        name: 'Gemma 3 4B',
        contextWindow: 32_000,
        provider: 'openrouter',
        notes: 'Efficient, good at code',
      },
    ],
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    logo: '◈',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyLabel: 'Groq API Key',
    free: true,
    color: '#f97316',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        contextWindow: 128_000,
        provider: 'groq',
        notes: 'Fast LPU inference',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        contextWindow: 128_000,
        provider: 'groq',
        notes: 'Very fast',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        contextWindow: 32_000,
        provider: 'groq',
        notes: 'Great for agent tasks',
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma 2 9B',
        contextWindow: 8_000,
        provider: 'groq',
        notes: 'Lightweight, fast',
      },
    ],
  },

  google: {
    id: 'google',
    name: 'Google AI',
    logo: '�色',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKeyLabel: 'Google AI API Key',
    free: true,
    color: '#4285f4',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        contextWindow: 1_000_000,
        provider: 'google',
        notes: 'Fastest, 1M context, free',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        contextWindow: 1_000_000,
        provider: 'google',
        notes: 'Very reliable, large context',
      },
      {
        id: 'gemini-1.5-flash-8b',
        name: 'Gemini 1.5 Flash 8B',
        contextWindow: 1_000_000,
        provider: 'google',
        notes: 'Lighter variant',
      },
    ],
  },

  together: {
    id: 'together',
    name: 'Together AI',
    logo: '◉',
    baseUrl: 'https://api.together.xyz/v1',
    apiKeyLabel: 'Together AI API Key',
    free: true,
    color: '#3b82f6',
    models: [
      {
        id: 'meta-llama/Llama-3-70b-chat-hf',
        name: 'Llama 3 70B',
        contextWindow: 8_000,
        provider: 'together',
        notes: 'Strong reasoning',
      },
      {
        id: 'mistralai/Mistral-7B-Instruct-v0.3',
        name: 'Mistral 7B v0.3',
        contextWindow: 32_000,
        provider: 'together',
        notes: 'Updated Mistral',
      },
      {
        id: 'Qwen/Qwen2.5-72B-Instruct',
        name: 'Qwen 2.5 72B',
        contextWindow: 32_000,
        provider: 'together',
        notes: 'Top quality',
      },
    ],
  },

  nvidia: {
    id: 'nvidia',
    name: 'Nvidia NIM',
    logo: '◈',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKeyLabel: 'Nvidia API Key',
    free: true,
    color: '#76b900',
    // The Cakra orchestrator routes across this NIM pool. Each model is tagged
    // with the role(s) it's best at. Model IDs reflect the June 2026 NIM
    // catalog — edit here as NVIDIA updates the catalog; the orchestrator falls
    // back to deepseek-v4-flash if any id 404s.
    models: [
      {
        id: 'nvidia/llama-3.1-nemotron-nano-8b-v1',
        name: 'Nemotron Nano 8B',
        contextWindow: 128_000,
        provider: 'nvidia',
        notes: 'Tiny + fast — the router/classifier',
        roles: ['router'],
        tier: 'fast',
      },
      {
        id: 'meta/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B',
        contextWindow: 128_000,
        provider: 'nvidia',
        notes: 'Solid general-purpose chat',
        roles: ['chat'],
        tier: 'balanced',
      },
      {
        id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        name: 'Nemotron Super 49B v1.5',
        contextWindow: 128_000,
        provider: 'nvidia',
        notes: 'Balanced agentic workhorse, strong tool use',
        roles: ['agentic', 'verifier'],
        tier: 'balanced',
      },
      {
        id: 'deepseek-ai/deepseek-v4-flash',
        name: 'DeepSeek V4 Flash',
        contextWindow: 1_000_000,
        provider: 'nvidia',
        notes: '284B MoE · 1M ctx · fast coding & agents',
        roles: ['code', 'agentic', 'chat'],
        tier: 'balanced',
      },
      {
        id: 'minimaxai/minimax-m3',
        name: 'MiniMax M3',
        contextWindow: 1_000_000,
        provider: 'nvidia',
        notes: '428B MoE (22B active) · multimodal · long-horizon coding & agents',
        roles: ['reasoning', 'code', 'agentic', 'vision'],
        tier: 'frontier',
      },
      {
        id: 'nvidia/nemotron-3-super-120b-a12b',
        name: 'Nemotron 3 Super 120B',
        contextWindow: 128_000,
        provider: 'nvidia',
        notes: 'Fast frontier reasoner — planner / Thinker',
        roles: ['reasoning', 'agentic', 'verifier'],
        tier: 'frontier',
      },
      {
        id: 'deepseek-ai/deepseek-v4-pro',
        name: 'DeepSeek V4 Pro',
        contextWindow: 1_000_000,
        provider: 'nvidia',
        notes: 'Deepest reasoning — verifier / Thinker (slow, high-accuracy)',
        roles: ['reasoning', 'verifier'],
        tier: 'frontier',
      },
      {
        id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
        name: 'Nemotron Ultra 253B',
        contextWindow: 128_000,
        provider: 'nvidia',
        notes: 'Top-tier reasoning accuracy',
        roles: ['reasoning'],
        tier: 'frontier',
      },
    ],
  },
}

export const PROVIDER_LIST = Object.values(PROVIDERS)

/** Get a provider by ID */
export function getProvider(id: ProviderId): Provider {
  return PROVIDERS[id]
}

/** Get all free models across all providers */
export function getAllFreeModels(): ModelInfo[] {
  return PROVIDER_LIST.flatMap(p => p.models)
}

/** Get model info by full model ID */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  for (const provider of PROVIDER_LIST) {
    const model = provider.models.find(m => m.id === modelId)
    if (model) return model
  }
  return undefined
}

/** Get provider for a given model ID */
export function getProviderForModel(modelId: string): Provider | undefined {
  for (const provider of PROVIDER_LIST) {
    if (provider.models.some(m => m.id === modelId)) {
      return provider
    }
  }
  return undefined
}

/** The NIM model pool the Cakra orchestrator routes across */
export function getNimPool(): ModelInfo[] {
  return PROVIDERS.nvidia.models
}

/** Pick the first NIM model that has a given role, optionally excluding ids */
export function pickNimByRole(role: import('./types').ModelRole, exclude: string[] = []): ModelInfo | undefined {
  return getNimPool().find(m => m.roles?.includes(role) && !exclude.includes(m.id))
}

/** Get provider from an API key prefix hint (rough heuristic) */
export function guessProviderFromKey(key: string): ProviderId | null {
  if (!key) return null
  if (key.startsWith('sk-or-')) return 'openrouter'
  if (key.startsWith('gsk_')) return 'groq'
  if (key.length === 39 && !key.includes('-')) return 'google'
  if (key.startsWith('tok_')) return 'together'
  if (key.startsWith('nvapi-')) return 'nvidia'
  return null
}