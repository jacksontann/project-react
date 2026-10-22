/*
 * Deep imports of individual zxcvbn-ts English dictionaries, so the strength meter can skip the
 * heaviest ones (US surnames: 313 KB, Wikipedia: 128 KB gzipped). The packages ship these as
 * CommonJS modules without their own type declarations.
 */
declare module '@zxcvbn-ts/language-en/dist/commonWords.json.js' {
  const words: string[];
  export default words;
}

declare module '@zxcvbn-ts/language-en/dist/firstnames.json.js' {
  const names: string[];
  export default names;
}

declare module '@zxcvbn-ts/language-en/dist/translations.js' {
  const translations: (typeof import('@zxcvbn-ts/language-en'))['translations'];
  export default translations;
}
