let taskId = 0
export default function workLoop(deadline: IdleDeadline) {
  taskId++
  console.log(deadline.timeRemaining())
  while (deadline.timeRemaining() > 1) {
    console.log('workLoop')
  }
  requestIdleCallback(workLoop)
}
