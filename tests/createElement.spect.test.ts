import React from '@meact/core'
import { it, expect, describe } from 'vitest'

describe("createElement", () => {
  it("should create a React element with the given type and props", () => {
    const element = React.createElement('div', { className: 'container' }, 'Hello, World!')
    expect(element.type).toBe('div')
    expect(element.props).toEqual({ className: 'container' })
    expect(element.children).toEqual(['Hello, World!'])
  })

  it("should create a React element with no props and no children", () => {
    const element = React.createElement('span')
    expect(element.type).toBe('span')
    expect(element.props).toEqual({})
    expect(element.children).toEqual([])
  })

  // Add more test cases here...

})