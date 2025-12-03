export type SnippetCategory = "css" | "js" | "html" | "mixed";

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  category: SnippetCategory;
  code: string;
  preview?: string;
  tags: string[];
  charCount: number;
}

export interface SelectedSnippet {
  id: string;
  name: string;
  charCount: number;
}

export type ModalTab = "components" | "templates" | "assets" | "snippets" | "chats";
