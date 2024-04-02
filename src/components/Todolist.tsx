/**@jsx createElement */
import { createElement, useState, useEffect } from "@meact/core"
// import CReact from "../draft/React"
// const { createElement, useState, useEffect } = CReact
type Todo = {
  id: string;
  title: string;
  completed: boolean;
}

export default function Todolist() {
  const [todo, setTodo] = useState<string>('')
  const [filter, setFilter] = useState<string>('all')
  const [todos, setTodos] = useState<Todo[]>([
    // {
    //   "id": '1',
    //   "title": "delectus aut autem",
    //   "completed": false
    // },
    // {
    //   "id": '2',
    //   "title": "quis ut nam facilis et officia qui",
    //   "completed": true
    // },
    // {
    //   "id": '3',
    //   "title": "fugiat veniam minus",
    //   "completed": false
    // },
    // {
    //   "id": '4',
    //   "title": "et porro tempora",
    //   "completed": true
    // },
    // {
    //   "id": '5',
    //   "title": "laboriosam mollitia et enim quasi adipisci quia provident illum",
    //   "completed": false
    // },
    // {
    //   "id": '6',
    //   "title": "qui ullam ratione quibusdam voluptatem quia omnis",
    //   "completed": true
    // },
    // {
    //   "id": '7',
    //   "title": "illo expedita consequatur quia in",
    //   "completed": false
    // },
    // {
    //   "id": '8',
    //   "title": "quo adipisci enim quam ut ab",
    //   "completed": true
    // },
    // {
    //   "id": '9',
    //   "title": "molestiae perspiciatis ipsa",
    //   "completed": false
    // },
    // {
    //   "id": '10',
    //   "title": "illo est ratione doloremque quia maiores aut",
    //   "completed": false
    // }
  ])

  const list = todos.filter(todo => {
    if (filter === 'all') return true
    if (filter === 'completed') return todo.completed
    if (filter === 'uncompleted') return !todo.completed
    return true
  })
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
  const save = () => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }

  useEffect(() => {
    // fetch('https://jsonplaceholder.typicode.com/todos')
    //   .then(response => response.json())
    //   .then(data => setTodos(data))
    const todos = localStorage.getItem('todos')

    if (todos) {
      setTodos(JSON.parse(todos))
    }
    return () => {
      console.log('unmount');
    }
  }, [])
  return (
    <div>
      <h1>Todos</h1>
      <form onSubmit={
        e => { e.preventDefault(); addTodo() }
      }>
        <label htmlFor="new-todo">Add a todo</label>
        <input
          type="text"
          id="new-todo"
          placeholder="E.g. Feed the cat"
          value={todo}
          onInput={e => setTodo(e.currentTarget.value)}
        />
        <button type="submit">Add</button>
      </form>
      <div>
        filter:
        <input type="radio" name="filter" id="all" checked={filter === 'all'} onChange={() => setFilter('all')} />
        <label htmlFor="all">All</label>
        <input type="radio" name="filter" id="completed" checked={filter === 'completed'} onChange={() => setFilter('completed')} />
        <label htmlFor="completed">Completed</label>
        <input type="radio" name="filter" id="uncompleted" checked={filter === 'uncompleted'} onChange={() => setFilter('uncompleted')} />
        <label htmlFor="uncompleted">Uncompleted</label>

      </div>
      <ul>
        {list.map((todo, index) => (
          <li key={todo.id}>
            <input type="checkbox"
              checked={todo.completed}
              onChange={() => {
                const newTodos = [...todos]
                newTodos[index].completed = !newTodos[index].completed
                setTodos(newTodos)
              }}
            />
            {/* <span
              style={
                {
                  textDecoration: todo.completed ? 'line-through' : 'none'
                }
              }
            >
              {todo.title}</span> */}
            {
              todo.completed ? <del>{todo.title}</del> : todo.title
            }
            <button
              onClick={() => {
                const newTodos = [...todos]
                newTodos.splice(index, 1)
                setTodos(newTodos)
              }}
            >
              remove
            </button>
          </li>
        ))}
      </ul>
      <div>
        {/* <button onClick={() => setTodos([])}>Clear</button>
        <button onClick={() => {
          const newTodos = todos.filter(todo => !todo.completed)
          setTodos(newTodos)
        }
        }>
          Clear completed
        </button> */}
        <button
          onClick={save}
        >save</button>
      </div>
    </div>

  );
}