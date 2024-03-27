import { render, RElement } from "@meact/core"

const ReactDOM = {
  createRoot(container: HTMLElement) {
    console.log('container:', container);

    return {
      render(el: RElement) {
        console.log('el', el);

        render(el, container)
      }
    }
  }
}

export default ReactDOM