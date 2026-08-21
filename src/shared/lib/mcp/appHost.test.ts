import { describe, expect, test } from 'vitest'
import { isMcpAppHost } from './appHost'

describe('isMcpAppHost', () => {
  test('detects the exact Mcp resource marker', () => {
    document.head.innerHTML = '<meta name="secretary-host" content="mcp-app">'

    expect(isMcpAppHost(document)).toBe(true)
  })

  test('does not treat another host value as Mcp', () => {
    document.head.innerHTML = '<meta name="secretary-host" content="telegram">'

    expect(isMcpAppHost(document)).toBe(false)
  })
})
