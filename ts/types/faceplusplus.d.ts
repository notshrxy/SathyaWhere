declare module 'faceplusplus' {
    export interface FacePPConfig {
        apiKey: string;
        apiSecret: string;
    }

    export interface DetectOptions {
        image_base64: string;
        return_landmark?: number;
        return_attributes?: string;
    }

    export interface DetectResult {
        faces: Array<{
            face_token: string;
            face_rectangle: {
                top: number;
                left: number;
                width: number;
                height: number;
            };
        }>;
    }

    export interface CompareOptions {
        face_token1: string;
        face_token2: string;
    }

    export interface CompareResult {
        confidence: number;
        thresholds: {
            '1e-3': number;
            '1e-4': number;
            '1e-5': number;
        };
    }

    export default class FacePP {
        constructor(config: FacePPConfig);
        detect(options: DetectOptions): Promise<DetectResult>;
        compare(options: CompareOptions): Promise<CompareResult>;
    }
}
