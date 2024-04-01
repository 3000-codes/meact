/**@jsx CReact.createElement */
// import CReact from "./draft/React"
import CReact from "@meact/core"
import TodoList from "./components/Todolist"
import Counter from "./components/Counter"
export default function App() {
  const [show, setShow] = CReact.useState(true)

  return <div>
    <button onClick={() => setShow(!show)} >toggle</button>
    {show ? <Counter /> : <p>44444</p>}
    <TodoList />
  </div>
}

