export const MCP_HOST_SELECTOR =
  'meta[name="secretary-host"][content="mcp-app"]'

export function isMcpAppHost(document: Document): boolean {
  return document.querySelector(MCP_HOST_SELECTOR) !== null
}
