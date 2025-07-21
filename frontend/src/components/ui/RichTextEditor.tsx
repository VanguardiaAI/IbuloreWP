"use client";

import { Control, Controller } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@ckeditor/ckeditor5-core";
import type { EventInfo } from "@ckeditor/ckeditor5-utils";
import { Skeleton } from "@/components/ui/skeleton";

interface RichTextEditorProps {
  control: Control<any>;
  name: string;
}

export function RichTextEditor({ control, name }: RichTextEditorProps) {
  const editorRef = useRef<{ CKEditor: any; ClassicEditor: any } | null>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);

  useEffect(() => {
    // Cargar dinámicamente el editor solo en el lado del cliente
    import("@ckeditor/ckeditor5-react").then((ckeditorModule) => {
      import("@ckeditor/ckeditor5-build-classic").then((classicEditorModule) => {
        editorRef.current = {
          CKEditor: ckeditorModule.CKEditor,
          ClassicEditor: classicEditorModule.default,
        };
        setIsEditorLoaded(true);
      });
    });
  }, []);

  if (!isEditorLoaded) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  const { CKEditor, ClassicEditor } = editorRef.current!;

  return (
    <div className="ck-content-reset max-w-none [&_.ck-editor__main>.ck-editor__editable]:min-h-[250px] [&_.ck-editor__main>.ck-editor__editable]:bg-background [&_.ck-editor__main>.ck-editor__editable]:text-foreground [&_.ck-toolbar]:bg-background [&_.ck-toolbar]:border-border [&_.ck-button]:text-foreground [&_.ck-button.ck-on]:!bg-muted">
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <CKEditor
            editor={ClassicEditor}
            data={field.value || ""}
            onChange={(event: EventInfo, editor: Editor) => {
              const data = editor.getData();
              field.onChange(data);
            }}
            onReady={(editor: Editor) => {
              // You can use the editor instance here if needed
            }}
          />
        )}
      />
    </div>
  );
} 