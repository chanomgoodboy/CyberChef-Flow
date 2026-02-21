// Custom loader: transforms `assert {type: "json"}` → `with {type: "json"}`
// Required because CyberChef uses the deprecated assert syntax and Node v25 dropped it.
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (result.format === 'module' && result.source) {
    const src = typeof result.source === 'string'
      ? result.source
      : new TextDecoder().decode(result.source);
    if (src.includes('assert {type:') || src.includes('assert { type:')) {
      return {
        ...result,
        source: src.replace(/\bassert\s*\{/g, 'with {'),
      };
    }
  }
  return result;
}
