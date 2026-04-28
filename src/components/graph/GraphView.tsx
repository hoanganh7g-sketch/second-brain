'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraphData, GraphNode, GraphLink } from '@/types'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string } | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null)

  useEffect(() => {
    async function loadGraph() {
      const [{ data: notes }, { data: links }] = await Promise.all([
        supabase.from('notes').select('id, title'),
        supabase.from('note_links').select('source_id, target_id'),
      ])
      if (notes) {
        setGraphData({
          nodes: notes.map((n) => ({ id: n.id, title: n.title })),
          links: (links || []).map((l) => ({ source: l.source_id, target: l.target_id })),
        })
      }
    }
    loadGraph()
  }, [])

  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return

    const { width, height } = containerRef.current.getBoundingClientRect()
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform))
    zoomRef.current = zoom
    svgSelRef.current = svg
    svg.call(zoom)

    const g = svg.append('g')

    // Defs for glow effect
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }))
    const links: GraphLink[] = graphData.links.map((l) => ({ ...l }))

    const linkedNodeIds = new Set(
      links.flatMap((l) => [
        typeof l.source === 'string' ? l.source : (l.source as GraphNode).id,
        typeof l.target === 'string' ? l.target : (l.target as GraphNode).id,
      ])
    )

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(120)
        .strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40))

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#4f46e5')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)

    // Node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          }) as never
      )

    // Circle
    node.append('circle')
      .attr('r', (d) => linkedNodeIds.has(d.id) ? 10 : 7)
      .attr('fill', (d) => linkedNodeIds.has(d.id) ? '#6366f1' : '#475569')
      .attr('stroke', (d) => linkedNodeIds.has(d.id) ? '#818cf8' : '#64748b')
      .attr('stroke-width', 1.5)
      .attr('filter', (d) => linkedNodeIds.has(d.id) ? 'url(#glow)' : null)

    // Label
    node.append('text')
      .text((d) => d.title.length > 20 ? d.title.slice(0, 20) + '…' : d.title)
      .attr('x', 13)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#94a3b8')
      .attr('pointer-events', 'none')

    // Hover + click
    node
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .transition().duration(150)
          .attr('r', (linkedNodeIds.has(d.id) ? 10 : 7) + 3)
          .attr('fill', '#818cf8')
        setTooltip({ x: event.offsetX + 12, y: event.offsetY - 12, title: d.title })
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget).select('circle')
          .transition().duration(150)
          .attr('r', linkedNodeIds.has(d.id) ? 10 : 7)
          .attr('fill', linkedNodeIds.has(d.id) ? '#6366f1' : '#475569')
        setTooltip(null)
      })
      .on('click', (_, d) => router.push(`/notes/${d.id}`))

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0)
      node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })
  }, [graphData, router])

  useEffect(() => { renderGraph() }, [renderGraph])

  function handleZoom(factor: number) {
    if (zoomRef.current && svgSelRef.current) {
      svgSelRef.current.transition().duration(300).call(zoomRef.current.scaleBy, factor)
    }
  }

  function handleReset() {
    if (zoomRef.current && svgSelRef.current) {
      svgSelRef.current.transition().duration(300).call(
        zoomRef.current.transform, d3.zoomIdentity
      )
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-white font-semibold text-sm">Graph View</h1>
        <p className="text-slate-500 text-xs mt-0.5">
          {graphData.nodes.length} ghi chú · {graphData.links.length} liên kết
        </p>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
        <Button size="icon" variant="ghost"
          onClick={() => handleZoom(1.3)}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost"
          onClick={() => handleZoom(0.75)}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost"
          onClick={handleReset}
          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.title}
        </div>
      )}

      {/* Empty state */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-500 text-sm">
            Chưa có ghi chú nào. Tạo ghi chú và dùng [[liên kết]] để xây dựng graph.
          </p>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}
