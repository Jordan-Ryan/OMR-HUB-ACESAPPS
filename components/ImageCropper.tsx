'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  aspectRatio?: number; // width/height, undefined for free aspect
  minWidth?: number;
  minHeight?: number;
}

export default function ImageCropper({
  imageFile,
  onCrop,
  onCancel,
  aspectRatio = 16 / 9, // Default to 16:9 for event images
  minWidth = 100,
  minHeight = 100,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [contentLeft, setContentLeft] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to constrain crop area within image bounds
  const constrainCropArea = useCallback((
    crop: { x: number; y: number; width: number; height: number },
    imgSize: { width: number; height: number }
  ) => {
    let { x, y, width, height } = crop;

    // Enforce minimum size
    if (width < minWidth) {
      width = minWidth;
      if (aspectRatio) {
        height = width / aspectRatio;
      }
    }
    if (height < minHeight) {
      height = minHeight;
      if (aspectRatio) {
        width = height * aspectRatio;
      }
    }

    // Maintain aspect ratio if specified
    if (aspectRatio) {
      // If width changed, adjust height
      if (width !== crop.width) {
        height = width / aspectRatio;
      } else if (height !== crop.height) {
        width = height * aspectRatio;
      }
    }

    // Constrain to image bounds
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + width > imgSize.width) {
      x = imgSize.width - width;
      if (x < 0) {
        x = 0;
        width = imgSize.width;
        if (aspectRatio) {
          height = width / aspectRatio;
          if (height > imgSize.height) {
            height = imgSize.height;
            width = height * aspectRatio;
            x = Math.max(0, imgSize.width - width);
          }
        }
      }
    }
    if (y + height > imgSize.height) {
      y = imgSize.height - height;
      if (y < 0) {
        y = 0;
        height = imgSize.height;
        if (aspectRatio) {
          width = height * aspectRatio;
          if (width > imgSize.width) {
            width = imgSize.width;
            height = width / aspectRatio;
            y = Math.max(0, imgSize.height - height);
          }
        }
      }
    }

    return { x, y, width, height };
  }, [aspectRatio, minWidth, minHeight]);

  // Calculate the left position of the main content area (after sidebars)
  useEffect(() => {
    const calculateContentLeft = () => {
      const contentWrapper = document.querySelector('.admin-content-wrapper') as HTMLElement;
      if (contentWrapper) {
        const rect = contentWrapper.getBoundingClientRect();
        setContentLeft(rect.left);
      } else {
        // Not in admin layout, cover full screen
        setContentLeft(0);
      }
    };

    calculateContentLeft();
    
    // Recalculate when sidebars toggle
    const handleSidebarToggle = () => {
      // Small delay to allow DOM to update
      setTimeout(calculateContentLeft, 100);
    };
    
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', calculateContentLeft);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', calculateContentLeft);
    };
  }, []);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imageSrc) return;

    // Create a new image to get dimensions
    const img = new Image();
    
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      if (width === 0 || height === 0) {
        console.error('ImageCropper: Invalid image dimensions', width, height);
        return;
      }
      
      setImageSize({ width, height });

      // Initialize crop area - use 16:9 aspect ratio, centered, as large as possible
      let initialWidth: number;
      let initialHeight: number;

      if (aspectRatio) {
        // Calculate maximum crop size that fits within image with aspect ratio
        const imageAspect = width / height;
        if (imageAspect > aspectRatio) {
          // Image is wider than target aspect ratio
          initialHeight = height * 0.8;
          initialWidth = initialHeight * aspectRatio;
        } else {
          // Image is taller than target aspect ratio
          initialWidth = width * 0.8;
          initialHeight = initialWidth / aspectRatio;
        }
      } else {
        initialWidth = width * 0.8;
        initialHeight = height * 0.8;
      }

      const initialCrop = constrainCropArea(
        {
          x: (width - initialWidth) / 2,
          y: (height - initialHeight) / 2,
          width: initialWidth,
          height: initialHeight,
        },
        { width, height }
      );

      setCropArea(initialCrop);
    };
    
    img.onerror = (e) => {
      console.error('ImageCropper: Error loading image', e);
    };
    
    img.src = imageSrc;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, aspectRatio, constrainCropArea]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is inside crop area
    const scaleX = imageRef.current.offsetWidth / imageSize.width;
    const scaleY = imageRef.current.offsetHeight / imageSize.height;

    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropW = cropArea.width * scaleX;
    const cropH = cropArea.height * scaleY;

    if (
      x >= cropX &&
      x <= cropX + cropW &&
      y >= cropY &&
      y <= cropY + cropH
    ) {
      setIsDragging(true);
      setDragStart({
        x: x - cropX,
        y: y - cropY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;

    // Scale from display coordinates to natural image coordinates
    const scaleX = imageSize.width / imageRef.current.offsetWidth;
    const scaleY = imageSize.height / imageRef.current.offsetHeight;

    const newX = x * scaleX;
    const newY = y * scaleY;

    const constrained = constrainCropArea(
      {
        ...cropArea,
        x: newX,
        y: newY,
      },
      imageSize
    );

    setCropArea(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResize = (direction: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...cropArea };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current || !containerRef.current) return;

      if (!imageRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      // Scale from display coordinates to natural image coordinates
      const scaleX = imageSize.width / imageRef.current.offsetWidth;
      const scaleY = imageSize.height / imageRef.current.offsetHeight;

      const deltaX = (moveEvent.clientX - startX) * scaleX;
      const deltaY = (moveEvent.clientY - startY) * scaleY;

      let newCrop = { ...startCrop };

      // Handle resizing based on direction
      if (direction.includes('n')) {
        const newHeight = startCrop.height - deltaY;
        const newY = startCrop.y + deltaY;
        if (aspectRatio) {
          const newWidth = newHeight * aspectRatio;
          newCrop.width = newWidth;
          newCrop.height = newHeight;
          newCrop.x = startCrop.x + (startCrop.width - newWidth) / 2;
          newCrop.y = newY;
        } else {
          newCrop.height = newHeight;
          newCrop.y = newY;
        }
      }
      if (direction.includes('s')) {
        const newHeight = startCrop.height + deltaY;
        if (aspectRatio) {
          const newWidth = newHeight * aspectRatio;
          newCrop.width = newWidth;
          newCrop.height = newHeight;
          newCrop.x = startCrop.x + (startCrop.width - newWidth) / 2;
        } else {
          newCrop.height = newHeight;
        }
      }
      if (direction.includes('w')) {
        const newWidth = startCrop.width - deltaX;
        const newX = startCrop.x + deltaX;
        if (aspectRatio) {
          const newHeight = newWidth / aspectRatio;
          newCrop.width = newWidth;
          newCrop.height = newHeight;
          newCrop.x = newX;
          newCrop.y = startCrop.y + (startCrop.height - newHeight) / 2;
        } else {
          newCrop.width = newWidth;
          newCrop.x = newX;
        }
      }
      if (direction.includes('e')) {
        const newWidth = startCrop.width + deltaX;
        if (aspectRatio) {
          const newHeight = newWidth / aspectRatio;
          newCrop.width = newWidth;
          newCrop.height = newHeight;
          newCrop.y = startCrop.y + (startCrop.height - newHeight) / 2;
        } else {
          newCrop.width = newWidth;
        }
      }

      // Constrain the crop area
      const constrained = constrainCropArea(newCrop, imageSize);
      setCropArea(constrained);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleApply = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate source coordinates from natural image size
    const sx = cropArea.x;
    const sy = cropArea.y;
    const sw = cropArea.width;
    const sh = cropArea.height;

    ctx.drawImage(
      imageRef.current,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const croppedFile = new File([blob], imageFile.name, {
          type: imageFile.type || 'image/jpeg',
          lastModified: Date.now(),
        });

        onCrop(croppedFile);
      },
      imageFile.type || 'image/jpeg',
      1.0
    );
  };

  if (!imageSrc) {
    return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: `${contentLeft}px`,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
        <div style={{ color: '#FFFFFF', fontSize: '17px' }}>Loading image...</div>
      </div>
    );
  }

  if (imageSize.width === 0 || imageSize.height === 0) {
    return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: `${contentLeft}px`,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
        <div style={{ color: '#FFFFFF', fontSize: '17px' }}>Preparing crop area...</div>
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Loading..."
            style={{
              maxWidth: '200px',
              maxHeight: '200px',
              opacity: 0.5,
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth > 0 && img.naturalHeight > 0 && imageSize.width === 0) {
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
            }}
          />
        )}
      </div>
    );
  }

  // Calculate scale from natural image size to displayed size
  const scaleX = imageRef.current && imageSize.width > 0 ? imageRef.current.offsetWidth / imageSize.width : 1;
  const scaleY = imageRef.current && imageSize.height > 0 ? imageRef.current.offsetHeight / imageSize.height : 1;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: `${contentLeft}px`,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
        }}
      >
        <h2
          style={{
            color: '#FFFFFF',
            fontSize: '22px',
            fontWeight: '600',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Crop Image {aspectRatio && `(${Math.round(aspectRatio * 10) / 10}:1)`}
        </h2>

        <div
          ref={containerRef}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 200px)',
            cursor: isDragging ? 'grabbing' : 'grab',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 200px)',
              width: 'auto',
              height: 'auto',
              display: 'block',
              userSelect: 'none',
              objectFit: 'contain',
            }}
            draggable={false}
            onLoad={() => {
              // Ensure dimensions are set when the displayed image loads
              if (imageRef.current && imageSize.width === 0) {
                const width = imageRef.current.naturalWidth;
                const height = imageRef.current.naturalHeight;
                if (width > 0 && height > 0) {
                  setImageSize({ width, height });
                }
              }
            }}
          />

          {/* Overlay - positioned to match the actual image display */}
          {imageRef.current && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${imageRef.current.offsetWidth}px`,
                height: `${imageRef.current.offsetHeight}px`,
                background: 'rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
              }}
            >
              {/* Crop area */}
              <div
                style={{
                  position: 'absolute',
                  left: `${cropArea.x * scaleX}px`,
                  top: `${cropArea.y * scaleY}px`,
                  width: `${cropArea.width * scaleX}px`,
                  height: `${cropArea.height * scaleY}px`,
                  border: '2px solid #007AFF',
                  background: 'transparent',
                  boxSizing: 'border-box',
                  pointerEvents: 'auto',
                }}
              >
              {/* Corner handles */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'nw-resize',
                }}
                onMouseDown={(e) => handleResize('nw', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'ne-resize',
                }}
                onMouseDown={(e) => handleResize('ne', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'sw-resize',
                }}
                onMouseDown={(e) => handleResize('sw', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'se-resize',
                }}
                onMouseDown={(e) => handleResize('se', e)}
              />

              {/* Edge handles */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'n-resize',
                }}
                onMouseDown={(e) => handleResize('n', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 's-resize',
                }}
                onMouseDown={(e) => handleResize('s', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'w-resize',
                }}
                onMouseDown={(e) => handleResize('w', e)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: '-4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '12px',
                  height: '12px',
                  background: '#007AFF',
                  border: '2px solid #FFFFFF',
                  borderRadius: '2px',
                  cursor: 'e-resize',
                }}
                onMouseDown={(e) => handleResize('e', e)}
              />
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={onCancel}
            className="button button-secondary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="button button-primary"
            style={{
              fontSize: '15px',
              padding: '12px 24px',
            }}
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
