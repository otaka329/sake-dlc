// esbuild の text loader で .txt を文字列としてバンドルするための型宣言
declare module '*.txt' {
  const content: string;
  export default content;
}
