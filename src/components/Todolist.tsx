/**@jsx createElement */
import { createElement, useState, useEffect } from "@meact/core"
// import CReact from "../draft/React"
// const { createElement, useState } = CReact
type Todo = {
  id: string;
  title: string;
  completed: boolean;
}
// CReact.useEffect(() => {
//   fetch('https://jsonplaceholder.typicode.com/todos')
//     .then(response => response.json())
//     .then(data => setTodos(data))
// }, [])

// const [todos, setTodos] = useState<Todo[]>([
// {
//   "userId": 1,
//   "id": 1,
//   "title": "delectus aut autem",
//   "completed": false
// },
//   {
//     "userId": 1,
//     "id": 2,
//     "title": "quis ut nam facilis et officia qui",
//     "completed": false
//   },
// ]);


export default function Todolist() {
  const [todo, setTodo] = useState<string>('')
  const [todos, setTodos] = useState<Todo[]>([
    {
      "id": '1',
      "title": "delectus aut autem",
      "completed": false
    },
  ])
  const addTodo = () => {

    if (!todo.trim()) return
    const value: Todo = {
      id: todos.length + 1 + '',
      title: todo.trim(),
      completed: false
    }
    setTodos([...todos, value])
    setTodo('')

  }
  return (
    <div>
      <h1>Todo List</h1>
      <p>todo:{todo}</p>
      <input type="text" value={todo} onInput={
        (evt: any) => {
          setTodo((evt.target as HTMLInputElement).value)
        }
      } />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(({ id, title }) => (
          <li key={id}>{title}</li>
        ))
        }
      </ul>
    </div>
  );
}