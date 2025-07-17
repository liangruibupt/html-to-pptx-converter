// Test setup file for Vitest
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Extend Vitest's expect method with methods from react-testing-library
import matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})