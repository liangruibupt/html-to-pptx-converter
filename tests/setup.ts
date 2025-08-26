// Test setup file for Vitest
import { expect, afterEach, vi } from 'vitest'

// Mock DOMParser for Node.js environment
if (typeof global.DOMParser === 'undefined') {
  global.DOMParser = class DOMParser {
    parseFromString(str: string, type: string) {
      // Simple mock implementation
      const doc = {
        documentElement: {
          innerHTML: str,
          textContent: str.replace(/<[^>]*>/g, ''),
          querySelectorAll: vi.fn(() => []),
          querySelector: vi.fn(() => null),
        },
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null),
        createElement: vi.fn(() => ({
          innerHTML: '',
          textContent: '',
          appendChild: vi.fn(),
          setAttribute: vi.fn(),
          getAttribute: vi.fn(() => ''),
        })),
        body: {
          innerHTML: str,
          textContent: str.replace(/<[^>]*>/g, ''),
          querySelectorAll: vi.fn(() => []),
          querySelector: vi.fn(() => null),
        }
      };
      return doc;
    }
  } as any;
}

// Mock URL methods
if (typeof global.URL === 'undefined') {
  global.URL = {
    createObjectURL: vi.fn(() => 'mock-blob-url'),
    revokeObjectURL: vi.fn(),
  } as any;
}

// Clean up after each test case
afterEach(() => {
  // Basic cleanup
  vi.clearAllMocks()
})