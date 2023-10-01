/* eslint-disable @next/next/no-img-element */
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import axios from 'axios'
import Draggable from 'react-draggable'
import { SketchPicker } from 'react-color'
import Head from 'next/head'
import html2canvas from 'html2canvas'

const ItemTypes = {
  text: 'text',
  box: 'box',
  image: 'image',
}

interface DragElement {
  type: keyof typeof ItemTypes
  element: {
    type: 'text' | 'box' | 'image'
    text?: string
    src?: string
    style: any
  }
}
interface Element {
  type: 'text' | 'box' | 'image'
  text?: string
  src?: string
  style: any
}

// based on this url make 10 diffeent placeholder images https://placehold.co/600x400/EEE/31343C
const placeholderImages = [
  'https://placehold.co/610x400/BBB/31343C.png',
  'https://placehold.co/600x410/EEE/ff0000.png',
  'https://placehold.co/610x400/EEE/31343C.png',
  'https://placehold.co/600x410/BBB/0000ff.png',
]

const Layers = React.memo(
  ({
    elements,
    selectedLayer,
    handleLayerClick,
    isDragging,
    onRemoveLayer,
  }: {
    elements: Element[]
    selectedLayer: number | null
    handleLayerClick: (index: number) => void
    isDragging: boolean
    onRemoveLayer?: (index: number) => void
  }) => {
    if (isDragging) {
      return null
    }

    return (
      <ul>
        {elements.map((element, index) => (
          <li key={index} className="mb-2 flex space-x-2 flex-row text-sm">
            <button
              className={`py-1 px-2 rounded ${
                index === selectedLayer
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
              onClick={() => handleLayerClick(index)}
            >
              Layer {index + 1} {element.type}
            </button>
            <button
              className="text-red-500"
              onClick={() => {
                onRemoveLayer && onRemoveLayer(index)
                // unselect
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    )
  }
)

Layers.displayName = 'Layer'

const DraggableElement = React.memo(
  ({
    element,
    isSelected,
    onSelect,
    onUpdatePosition,
    onDragStart,
    onDragEnd,
  }: {
    element: DragElement['element']
    isSelected: boolean
    onSelect: () => void
    onUpdatePosition: (x: number, y: number) => void
    onDragStart: () => void
    onDragEnd: () => void
  }) => {
    const { style } = element

    const handleDrag = (e: any, ui: any) => {
      const newX = ui.x
      const newY = ui.y
      onSelect() // Handle selection logic if needed
      onUpdatePosition(newX, newY) // Update position in the state
    }

    const elementStyle = {
      ...style,
      position: 'absolute',
      border: isSelected ? '2px dashed red' : 'none', // Add border for selected element
    }

    const handleClick = () => {
      onSelect() // Call the onSelect function when the element is clicked
    }

    switch (element.type) {
      case ItemTypes.text:
        return (
          <Draggable
            onStart={onDragStart}
            onStop={onDragEnd}
            position={{
              x: parseInt(style?.left || 0),
              y: parseInt(style?.top || 0),
            }}
            onDrag={handleDrag}
          >
            <div style={elementStyle} onClick={handleClick}>
              {element.text}
            </div>
          </Draggable>
        )
      case ItemTypes.box:
        return (
          <Draggable
            onStart={onDragStart}
            onStop={onDragEnd}
            position={{
              x: parseInt(style?.left || 0),
              y: parseInt(style?.top || 0),
            }}
            onDrag={handleDrag}
          >
            <div style={elementStyle} onClick={handleClick}></div>
          </Draggable>
        )
      case ItemTypes.image:
        return (
          <Draggable
            onStart={onDragStart}
            onStop={onDragEnd}
            position={{
              x: parseInt(style?.left || 0),
              y: parseInt(style?.top || 0),
            }}
            onDrag={handleDrag}
          >
            <div
              style={{
                ...elementStyle,
                objectFit: 'cover',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundImage: `url(${element.src})`,
              }}
              onClick={handleClick}
            />
          </Draggable>
        )
      default:
        return null
    }
  }
)
DraggableElement.displayName = 'DraggableElement'

const Home = () => {
  const [elements, setElements] = useState<Element[]>([])
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
  const [xPosition, setXPosition] = useState<number>(0)
  const [yPosition, setYPosition] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [pickerOpen, setPickerOpen] = useState<boolean>(false)

  const exportAsImage = async (element: HTMLElement, imageFileName: string) => {
    // unselect layer
    setSelectedLayer(null)

    setTimeout(async () => {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        scale: 6,
        backgroundColor: '#fff',
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: 900,
        height: 400,
      })

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const image = canvas.toDataURL('image/jpeg', 1.0)
      // download the image
      const link = document.createElement('a')
      link.download = imageFileName
      link.href = image
      link.click()
    }, 10)
  }

  useEffect(() => {
    const savedElements = localStorage.getItem('elements')
    if (savedElements) {
      setElements(JSON.parse(savedElements))
    }
  }, [])

  useEffect(() => {
    if (!elements?.length) return
    localStorage.setItem('elements', JSON.stringify(elements))
  }, [elements])

  const handleLayerClick = (index: number) => {
    setSelectedLayer(index)
    // Set initial X and Y positions of the selected layer

    // if same layer unselect
    if (selectedLayer === index) {
      setSelectedLayer(null)
      return
    }

    if (elements[index] && elements[index]?.style) {
      setXPosition(parseInt(elements[index]?.style?.left) || 0)
      setYPosition(parseInt(elements[index]?.style?.top) || 0)
    }
  }

  const addRandomElement = () => {
    const randomType = ['text', 'box', 'image'][Math.floor(Math.random() * 3)]
    let newElement: Element | null = null

    // calaulate a random size width & height for the new element
    // max width 300, max height 300
    const randomWidth = Math.floor(Math.random() * 300)
    const randomHeight = Math.floor(Math.random() * 300)

    // random position for the new element, max x 900, max y 400 = size of new element
    const randomX = 0
    const randomY = 0

    const randomTextString = Math.random().toString(36).substring(7)

    switch (randomType) {
      case 'text':
        newElement = {
          type: 'text',
          text: 'Random Text ' + randomTextString,
          style: {
            fontSize: '20px',
            lineHeight: '24px',
            fontFamily: 'sans-serif',
            color: '#000',
            position: 'absolute',
            left: `${randomX}px`,
            top: `${randomY}px`,
            boxSizing: 'border-box',
          },
        }
        break
      case 'box':
        newElement = {
          type: 'box',
          style: {
            width: `${randomWidth}px`,
            height: `${randomHeight}px`,
            backgroundColor: '#3498db',
            position: 'absolute',
            left: `${randomX}px`,
            top: `${randomY}px`,
            boxSizing: 'border-box',
          },
        }
        break
      case 'image':
        const randomImageSrc =
          placeholderImages[
            Math.floor(Math.random() * placeholderImages.length)
          ]
        newElement = {
          type: 'image',
          src: randomImageSrc,
          style: {
            width: `${randomWidth}px`,
            height: `${randomHeight}px`,
            position: 'absolute',
            left: `${randomX}px`,
            top: `${randomY}px`,
            boxSizing: 'border-box',
          },
        }
        break
      default:
        newElement = null
    }

    setElements([...(elements as Element[]), newElement as Element])
  }

  const handleApplyPositionClick = () => {
    if (selectedLayer !== null) {
      // Get the desired X and Y coordinates from your input fields or other sources
      const newX = xPosition
      const newY = yPosition
      handlePositionChange(newX, newY)
    }
  }

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const generateImage = async () => {
    try {
      // TODO: add loading state
      const minifiedData = encodeURIComponent(JSON.stringify(elements))
      const url = `/api/image?data=${minifiedData}`
      await axios.get(url)
      setPreviewImage(url)
    } catch (error) {
      console.error('Error generating image:', error)
    }
  }

  const handleElementSelect = useCallback(
    (index: number) => {
      setSelectedLayer(index)
      // if same layer unselect
      if (selectedLayer === index) {
        setSelectedLayer(null)
        return
      }
      if (elements[index] && elements[index].style) {
        setXPosition(parseInt(elements[index]?.style?.left) || 0)
        setYPosition(parseInt(elements[index]?.style?.top) || 0)
      }
    },
    [elements, selectedLayer]
  )

  const handlePositionChange = useCallback(
    (newX: number, newY: number) => {
      if (selectedLayer !== null) {
        setElements((prevElements) => {
          const updatedElements = [...prevElements]
          const selectedElement = updatedElements[selectedLayer]
          if (selectedElement && selectedElement.style) {
            selectedElement.style.left = `${newX}px`
            selectedElement.style.top = `${newY}px`
            // Ensure the element is within bounds
            // Return the updated elements array
            return updatedElements
          }
          return prevElements
        })
      }
    },
    [selectedLayer]
  )

  const draggableElements = useMemo(
    () =>
      elements.map((element, index) => (
        <DraggableElement
          key={index}
          element={element}
          isSelected={index === selectedLayer}
          onSelect={() => handleElementSelect(index)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onUpdatePosition={(x, y) => handlePositionChange(x, y)}
        />
      )),
    [elements, selectedLayer, handleElementSelect, handlePositionChange]
  )

  return (
    <div className="flex flex-col max-w-5xl min-h-screen mx-auto py-4">
      <Head>
        <title>Open-Image - Open Source Image Tools</title>
        <meta name="description" content="Open Source Image Tools" />
        <link rel="favicon" href="/favicon.ico" />
      </Head>
      <h1 className="text-4xl font-bold mb-4">
        Open-Image - Open Source Image Tools
      </h1>
      <div className="flex flex-row space-x-2 bg-slate-100">
        <div className="w-[170px]">
          <h2 className="text-lg font-semibold mb-2">Layers</h2>

          <Layers
            elements={elements}
            selectedLayer={selectedLayer}
            handleLayerClick={handleLayerClick}
            isDragging={isDragging}
            onRemoveLayer={(index) => {
              setSelectedLayer(null)

              const newElements = [...elements]
              newElements.splice(index, 1)
              setElements(newElements)

              // save to local storage
              localStorage.setItem('elements', JSON.stringify(newElements))
            }}
          />
        </div>
        <div className="canvas-editor flex flex-1 relative w-[900px] h-[400px] border border-gray-400 overflow-hidden">
          {draggableElements}
        </div>
        <div className="mr-8 w-[170px]">
          <h2 className="text-lg font-semibold mb-2">Sidebar</h2>

          <div>
            {selectedLayer !== null && !isDragging && (
              <div className="flex flex-col text-sm mr-2 space-y-2">
                <div className="flex flex-col">
                  <label className="mr-2">Width:</label>
                  <input
                    className="border border-gray-300 px-2 py-1 rounded"
                    type="number"
                    value={parseInt(elements[selectedLayer]?.style?.width || 0)}
                    onChange={(e) => {
                      setElements((prevElements) => {
                        const updatedElements = [...prevElements]
                        const selectedElement = updatedElements[selectedLayer]
                        if (
                          selectedElement &&
                          selectedElement.style &&
                          e.target.value
                        ) {
                          selectedElement.style.width = e.target.value + 'px'
                          // Return the updated elements array
                          return updatedElements
                        }
                        return prevElements
                      })
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mr-2">Height:</label>
                  <input
                    className="border border-gray-300 px-2 py-1 rounded"
                    type="number"
                    value={parseInt(
                      elements[selectedLayer]?.style?.height || 0
                    )}
                    onChange={(e) => {
                      setElements((prevElements) => {
                        const updatedElements = [...prevElements]
                        const selectedElement = updatedElements[selectedLayer]
                        if (
                          selectedElement &&
                          selectedElement.style &&
                          e.target.value
                        ) {
                          selectedElement.style.height = e.target.value + 'px'
                          // Return the updated elements array
                          return updatedElements
                        }
                        return prevElements
                      })
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mr-2">X Position:</label>
                  <input
                    className="border border-gray-300 px-2 py-1 rounded"
                    type="number"
                    value={xPosition}
                    onChange={(e) => {
                      setXPosition(parseInt(e.target.value, 10))
                      handleApplyPositionClick()
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mr-2">Y Position:</label>
                  <input
                    className="border border-gray-300 px-2 py-1 rounded"
                    type="number"
                    value={yPosition}
                    onChange={(e) => {
                      setYPosition(parseInt(e.target.value, 10))
                      handleApplyPositionClick()
                    }}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mr-2">Background Color:</label>

                  <div className="relative">
                    <button
                      className="border border-gray-300 px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          elements[selectedLayer]?.style?.backgroundColor || '',
                      }}
                      onClick={() => setPickerOpen((prev) => !prev)}
                    >
                      {elements[selectedLayer].style.backgroundColor}
                    </button>
                  </div>

                  {pickerOpen && (
                    <SketchPicker
                      color={elements[selectedLayer].style.backgroundColor}
                      onChange={(color) => {
                        setElements((prevElements) => {
                          const updatedElements = [...prevElements]
                          const selectedElement = updatedElements[selectedLayer]
                          if (
                            selectedElement &&
                            selectedElement.style &&
                            color.hex
                          ) {
                            selectedElement.style.backgroundColor = color.hex
                            // Return the updated elements array
                            return updatedElements
                          }
                          return prevElements
                        })
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded mr-4"
            onClick={addRandomElement}
          >
            Add Random Element
          </button>

          <button
            onClick={() =>
              exportAsImage(
                document.querySelector('.canvas-editor') as HTMLElement,
                `open-image-${new Date().getTime()}.jpg`
              )
            }
            className="bg-blue-500 text-white py-2 px-4 rounded mr-4"
          >
            Save
          </button>
          <button
            className="bg-indigo-500 text-white py-2 px-4 rounded"
            onClick={generateImage}
          >
            Generate Image
          </button>
          {previewImage && <img src={previewImage} alt="preview" />}
        </div>
      </div>
    </div>
  )
}

export default Home
