/// <reference types="vite/client" />

declare module 'react-dom/client' {
  import { ReactNode } from 'react'
  interface Container {
    render(children: ReactNode): void
    unmount(): void
  }
  export function createRoot(container: Element | DocumentFragment): Container
}

declare module 'vitest' {
  const vi: {
    fn: () => any
    mock: (path: string, factory?: () => any) => void
    spyOn: (obj: any, method: string) => any
  }
  function describe(name: string, fn: () => void): void
  function it(name: string, fn: () => void | Promise<void>): void
  function test(name: string, fn: () => void | Promise<void>): void
  function expect<T>(actual: T): any
  function beforeEach(fn: () => void): void
  function afterEach(fn: () => void): void
  function beforeAll(fn: () => void): void
  function afterAll(fn: () => void): void
}

declare module '@testing-library/jest-dom' {
  interface Matcher<R, T> {
    toBeInTheDocument(): R
    toHaveTextContent(text: string): R
    toBeVisible(): R
    toBeDisabled(): R
    toBeEnabled(): R
    toHaveClass(className: string): R
    toHaveAttribute(attr: string, value?: string): R
    toHaveValue(value: string): R
    toBeChecked(): R
  }
}
