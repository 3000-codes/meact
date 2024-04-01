/**@jsx CReact.createElement */
import CReact, { useEffect } from "@meact/core"
// import CReact from "../draft/React"
export default function Counter() {
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('i am working');
    }, 500)
    return () => {
      clearInterval(timer)
    }
  }, [])
  return (
    <div>
      Counter
    </div>
  );
}