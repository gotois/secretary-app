import { describe, expect, test } from 'vitest'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { getInitialRoute, getModalState } from './mcp-app'

describe('Mcp initial route', () => {
  test('opens the calendar for a regular widget', () => {
    expect(getInitialRoute()).toEqual({ name: ROUTE_NAMES.CALENDAR })
  })

  test('opens an edit modal from tool input', () => {
    expect(getInitialRoute({ mode: 'edit', taskId: 42 })).toEqual({
      name: ROUTE_NAMES.EDIT,
      params: { taskId: 42 },
    })
  })

  test('rejects incomplete modal input', () => {
    expect(getModalState({ mode: 'view' })).toBeUndefined()
    expect(getModalState({ mode: 'unknown', taskId: 42 })).toBeUndefined()
  })
})
