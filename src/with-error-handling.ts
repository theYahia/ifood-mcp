/**
 * MCP-spec tool error wrapper.
 *
 * Tools must return `{ isError: true, content: [{ type: "text", text }] }`
 * on failure so that LLM clients see the error in-band rather than as a
 * protocol-level fault.
 *
 * Mirrors `withErrorHandling` from @theyahia/mcp-core but kept standalone
 * to avoid pulling the workspace dep into the published npm package.
 */

type ToolContent = { type: "text"; text: string };
type ToolResult = { content: ToolContent[]; isError?: boolean };
type ToolHandler<P> = (params: P) => Promise<ToolResult>;

export function withErrorHandling<P>(handler: ToolHandler<P>): ToolHandler<P> {
  return async (params: P): Promise<ToolResult> => {
    try {
      return await handler(params);
    } catch (error) {
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  };
}
