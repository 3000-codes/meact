/**@jsx CReact.createElement */
import CReact, { useState } from "@meact/core"
type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}
// CReact.useEffect(() => {
//   fetch('https://jsonplaceholder.typicode.com/todos')
//     .then(response => response.json())
//     .then(data => setTodos(data))
// }, [])

// const [todos, setTodos] = useState<Todo[]>([
//   {
//     "userId": 1,
//     "id": 1,
//     "title": "delectus aut autem",
//     "completed": false
//   },
//   {
//     "userId": 1,
//     "id": 2,
//     "title": "quis ut nam facilis et officia qui",
//     "completed": false
//   },
// ]);


export default function Todolist() {
  // const [todos, setTodos] = useState<Todo[]>([])
  const todos = [
    {
      "id": 1,
      "title": "delectus aut autem",
      "completed": false
    },
    {
      "id": 2,
      "title": "quis ut nam facilis et officia qui",
      "completed": false
    },
  ]

  return (
    <div>
      <h1>Todo List</h1>
      <ul>
        {todos.length ? todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        )) : 'please wait...'
        }
      </ul>
    </div>
  );
}