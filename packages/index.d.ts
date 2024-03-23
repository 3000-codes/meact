
type RElement = {
  type: string,
  props: Record<string, any>,
  children: (RElement | string)[]
}

