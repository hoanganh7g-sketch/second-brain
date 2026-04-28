export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  tags?: Tag[]
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
}

export interface NoteLink {
  source_id: string
  target_id: string
}

export interface GraphNode {
  id: string
  title: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}
