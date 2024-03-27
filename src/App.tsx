/**@jsx CReact.createElement */
import CReact, { useState } from "@meact/core"
import TodoList from "./components/Todolist"
import Counter from "./components/Counter"
export default function App() {
  const [show, setShow] = useState(true)
  // let list = <TodoList />
  let list = TodoList()
  console.log('list', list);

  return <div>
    <button onClick={() => setShow(!show)} >toggle</button>
    {show ? <Counter /> : <p>44444</p>}
    {list}
  </div>
}

