/* eslint-disable @next/next/no-img-element */
// pages/api/image.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { ImageResponse } from '@vercel/og'

interface Element {
  type: 'text' | 'box' | 'image'
  style: React.CSSProperties
  text?: string
  src?: string
}

export const config = {
  runtime: 'edge',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { searchParams } = new URL(req?.url || '')
  const data = searchParams.has('data') ? searchParams.get('data') : '{}'
  const elements = JSON.parse(data || '{}')

  const renderedElements = (elements || []).map(
    (element: Element, index: number) => {
      switch (element.type) {
        case 'text':
          return (
            <div
              key={index}
              style={{
                ...element.style,
                transform: `translate(${element.style.left}, ${element.style.top})`,
              }}
            >
              {element.text}
            </div>
          )
        case 'box':
          return (
            <div
              key={index}
              style={{
                ...element.style,
                transform: `translate(${element.style.left}, ${element.style.top})`,
              }}
            ></div>
          )
        case 'image':
          // convert image to base64
          // load image form url to base64
          // const imageUrl = element.src || ''
          // image yrl to base64
          // const base64 = Buffer.from(imageUrl).toString('base64')
          return (
            <img
              key={index}
              src={element.src}
              // src={`data:image/png;base64,${base64}`}
              alt=""
              width={element.style.width}
              height={element.style.height}
              style={{
                ...element.style,
                objectFit: 'cover',
                transform: `translate(${element.style.left}, ${element.style.top})`,
              }}
            />
          )
        default:
          return null
      }
    }
  )

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '900px',
          height: '400px',
          background: 'white',
          position: 'relative',
        }}
      >
        {renderedElements}
      </div>
    ),
    {
      width: 900,
      height: 400,
    }
  )
}
