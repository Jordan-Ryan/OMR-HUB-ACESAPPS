'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { marked } from 'marked';
import TurndownService from 'turndown';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const quillRef = useRef<any>(null);
  const quillInstanceRef = useRef<any>(null);
  const turndownService = useMemo(() => {
    const service = new TurndownService();
    // Configure turndown to preserve formatting
    service.addRule('strikethrough', {
      filter: ['del', 's', 'strike'],
      replacement: (content) => '~~' + content + '~~'
    });
    return service;
  }, []);

  // Convert markdown to HTML when value changes (for initial load)
  // But show raw markdown text in the editor, not formatted
  useEffect(() => {
    if (value) {
      // Show the raw markdown text in the editor, not converted HTML
      // We'll convert to HTML only when saving
      setHtmlContent(value.replace(/\n/g, '<br>'));
    } else {
      setHtmlContent('');
    }
  }, [value]);

  const handleQuillChange = (html: string) => {
    setHtmlContent(html);
    // Extract plain text from HTML (preserve line breaks)
    // This keeps the raw markdown text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Replace <br> with newlines and get text content
    const text = tempDiv.innerText || tempDiv.textContent || '';
    // Convert <br> tags back to newlines
    const markdown = text.replace(/\n/g, '\n');
    onChange(markdown);
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  // No paste handler - let Quill handle paste normally
  // Markdown will be converted to HTML only when saving

  return (
    <div>
      <ReactQuill
        ref={(el) => {
          quillRef.current = el;
          if (el) {
            const quill = el.getEditor();
            quillInstanceRef.current = quill;
            // Set up paste handler when Quill is ready
            const cleanup = setupPasteHandler(quill);
            // Store cleanup function for later
            (quill as any).__pasteCleanup = cleanup;
          } else if (quillInstanceRef.current) {
            // Cleanup when component unmounts
            const cleanup = (quillInstanceRef.current as any).__pasteCleanup;
            if (cleanup) cleanup();
          }
        }}
        theme="snow"
        value={htmlContent}
        onChange={handleQuillChange}
        modules={modules}
        placeholder={placeholder || 'Enter challenge information...'}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      />
      <style jsx global>{`
        .ql-container {
          background: rgba(255, 255, 255, 0.08) !important;
          border: none !important;
          border-radius: 0 0 10px 10px !important;
          color: #FFFFFF !important;
          font-size: 15px !important;
        }
        .ql-editor {
          color: #FFFFFF !important;
          min-height: 200px !important;
        }
        .ql-editor.ql-blank::before {
          color: rgba(235, 235, 245, 0.4) !important;
        }
        .ql-toolbar {
          background: rgba(255, 255, 255, 0.04) !important;
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 10px 10px 0 0 !important;
        }
        .ql-toolbar .ql-stroke {
          stroke: rgba(255, 255, 255, 0.8) !important;
        }
        .ql-toolbar .ql-fill {
          fill: rgba(255, 255, 255, 0.8) !important;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button.ql-active {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: #FFFFFF !important;
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: #FFFFFF !important;
        }
        .ql-editor strong {
          font-weight: 600 !important;
          color: #FFFFFF !important;
        }
        .ql-editor em {
          font-style: italic !important;
        }
        .ql-editor code {
          background: rgba(255, 255, 255, 0.1) !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-family: monospace !important;
        }
        .ql-editor h1 {
          font-size: 20px !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          margin: 16px 0 12px 0 !important;
        }
        .ql-editor h2 {
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #FFFFFF !important;
          margin: 14px 0 10px 0 !important;
        }
        .ql-editor h3 {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #FFFFFF !important;
          margin: 12px 0 8px 0 !important;
        }
        .ql-editor ul,
        .ql-editor ol {
          padding-left: 24px !important;
          margin: 8px 0 !important;
        }
        .ql-editor li {
          margin-bottom: 6px !important;
        }
      `}</style>
    </div>
  );
}

