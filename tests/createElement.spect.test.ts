import React from '@meact/core'
import { it, expect, describe } from 'vitest'

describe("createElement", () => {
  it("should create a React element with the given type and props", () => {
    const element = React.createElement('div', { className: 'container' }, 'Hello, World!')
    expect(element.type).toBe('div')
    expect(element.props).toEqual({ className: 'container', children: ['Hello, World!'] })
  })

  it("should create a React element with no props and no children", () => {
    const element = React.createElement('span')
    expect(element.type).toBe('span')
    expect(element.props).toEqual({})
  })

  it("should render a React element with text content", () => {
    const element = React.createElement('p', {}, 'This is some text')
    const container = document.createElement('div')
    document.body.appendChild(container)
    React.render(element, container)
    expect(container.innerHTML).toBe('<p>This is some text</p>')
  })

  it("should render a React element with nested elements", () => {
    const element = React.createElement('div', {},
      React.createElement('h1', {}, 'Title'),
      React.createElement('p', {}, 'Paragraph')
    )
    const container = document.createElement('div')
    React.render(element, container)
    expect(container.innerHTML).toBe('<div><h1>Title</h1><p>Paragraph</p></div>')
  })

  // Add more test cases here...

})