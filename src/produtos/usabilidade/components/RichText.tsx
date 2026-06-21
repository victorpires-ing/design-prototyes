import { TextEditor } from "@/components/base/text-editor/text-editor";

interface RichTextProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

/** Editor de rich text (Untitled UI / TipTap) para campos de descrição e texto de apoio. */
export function RichText({ value, onChange, placeholder }: RichTextProps) {
    return (
        <TextEditor.Root
            content={value || ""}
            onUpdate={({ editor }) => {
                const html = editor.getHTML();
                onChange(html === "<p></p>" ? "" : html);
            }}
            placeholder={placeholder}
            inputClassName="min-h-28 resize-y"
        >
            <TextEditor.Toolbar />
            <div className="flex flex-col gap-2">
                <TextEditor.Content />
            </div>
        </TextEditor.Root>
    );
}
