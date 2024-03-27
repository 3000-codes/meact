import { render, RElement } from "@meact/core"

const ReactDOM = {
  createRoot(container: HTMLElement) {
    return {
      render(el: RElement) {
        render(el, container)
      }
    }
  }
}

export default ReactDOM