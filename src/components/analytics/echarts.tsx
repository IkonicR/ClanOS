"use client";

import React from 'react'
import ReactECharts from 'echarts-for-react'

export function EChart({ option, height = 320, className }: { option: any; height?: number; className?: string }) {
  return (
    <div className={className} style={{ height }}>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge lazyUpdate theme="dark" />
    </div>
  )
}
