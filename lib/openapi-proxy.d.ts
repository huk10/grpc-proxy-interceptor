import { Metadata, MetadataValue } from "@grpc/grpc-js";
export declare class ApiProxy {
    loadDone: boolean;
    private readonly openapi;
    private readonly getaway;
    private readonly openapiDir;
    constructor(getaway: string, openapiDir: string);
    private findDefinition;
    loadOpenapiFile(): Promise<void>;
    call(callPath: string, metadata: {
        [key: string]: MetadataValue[];
    }, body: {}): Promise<{
        response: any;
        metadata: Metadata;
        status: {
            code: any;
            metadata: Metadata;
            details: any;
        };
    }>;
}
