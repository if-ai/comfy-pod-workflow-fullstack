/**
 * Helper function to find an output by its output_id or node_id
 * @param outputs Array of outputs from the ComfyDeploy API
 * @param id The output_id or node_id to search for
 * @returns The image URL if found, null otherwise
 */
export function findOutputImageById(outputs: any[] | undefined, id: string): string | null {
    if (!outputs) return null;
    const outputNode = outputs.find(o => 
        o.output_id === id || 
        o.node_id === id || 
        (o.node_meta && o.node_meta.node_id === id)
    );
    return outputNode?.data?.images?.[0]?.url || null;
} 