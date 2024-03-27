/**@jsx CReact.createElement */
import CReact from "@meact/core"
import Counter from "./components/Counter"
export default function App() {
  const [count, setCount] = CReact.useState(0)
  const [show, setShow] = CReact.useState(!true)
  const handleClick = () => {
    setCount(count + 1)
  }

  return <div>
    <h1>hhhhh</h1>

    {show ? <Counter /> : 'null'}
    <button type="button" onClick={handleClick}>{count}</button>
    <button type="button" onClick={() => setShow(i => !i)}>remove inreament</button>
  </div>
}

