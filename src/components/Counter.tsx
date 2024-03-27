/**@jsx CReact.createElement */
import CReact from "@meact/core"
export default function Counter() {
  CReact.useEffect(() => {
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