// The languages you can pick for a file. `id` is Monaco's language id (syntax colors),
// `ext` is added to a file name typed without one, `starter` is the new file's content.
// Shared by the browser (pickers) and the server (validation), so no server imports here.

export type Language = { id: string; label: string; ext: string; starter: string };

export const LANGUAGES: readonly Language[] = [
  { id: 'csharp', label: 'C#', ext: 'cs', starter: 'Console.WriteLine("Hello, FocusOrbit!");\n' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', starter: "const greeting: string = 'Hello, FocusOrbit!';\nconsole.log(greeting);\n" },
  { id: 'javascript', label: 'JavaScript', ext: 'js', starter: "console.log('Hello, FocusOrbit!');\n" },
  { id: 'python', label: 'Python', ext: 'py', starter: 'print("Hello, FocusOrbit!")\n' },
  { id: 'java', label: 'Java', ext: 'java', starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, FocusOrbit!");\n    }\n}\n' },
  { id: 'cpp', label: 'C++', ext: 'cpp', starter: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, FocusOrbit!" << std::endl;\n    return 0;\n}\n' },
  { id: 'go', label: 'Go', ext: 'go', starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, FocusOrbit!")\n}\n' },
  { id: 'sql', label: 'SQL', ext: 'sql', starter: 'SELECT 1;\n' },
  { id: 'html', label: 'HTML', ext: 'html', starter: '<!doctype html>\n<html>\n  <body>\n    <h1>Hello, FocusOrbit!</h1>\n  </body>\n</html>\n' },
  { id: 'css', label: 'CSS', ext: 'css', starter: 'body {\n  margin: 0;\n}\n' },
  { id: 'json', label: 'JSON', ext: 'json', starter: '{\n  "hello": "FocusOrbit"\n}\n' },
  { id: 'markdown', label: 'Markdown', ext: 'md', starter: '# Notes\n' },
  { id: 'plaintext', label: 'Plain text', ext: 'txt', starter: '' },
];

export function languageById(id: unknown): Language | undefined {
  return LANGUAGES.find((l) => l.id === id);
}

/** "Program" + C# → "Program.cs". A name that already has an extension is kept as typed. */
export function withExtension(name: string, language: Language): string {
  const clean = name.trim();
  return clean.includes('.') ? clean : `${clean}.${language.ext}`;
}
