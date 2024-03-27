/**@jsx CReact.createElement */
import CReact from "@meact/core"
import Counter from "./components/Counter"
export default function App() {
  const handleClick = () => {
    console.log('click')

  }
  return <div>
    <h1>hhhhh</h1>
    <Counter />
    <button type="button" onClick={handleClick}>+1</button>
  </div>
}

