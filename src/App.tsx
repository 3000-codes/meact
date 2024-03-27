/**@jsx CReact.createElement */
import CReact from "@meact/core"
import Counter from "./components/Counter"
export default function App() {
  const [count, setCount] = CReact.useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  return <div>
    <h1>hhhhh</h1>
    <Counter />
    <button type="button" onClick={handleClick}>{count}</button>
  </div>
}

