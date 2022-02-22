export interface BucketOptions {
    video: string,
    admin: string,
}

class _Config {
    public version: string;
    public baseUrl: string;
    public clientId: number;
    public clientSecret: string;
    public ossPath: string;
    public ossBucket: string;
    public env: 'dev' | 'test' | 'prod';
    public imageMaxSize: number;
    public iconFont:string;
    public buckets: BucketOptions;
}

let config: _Config = require('../../env');

export var Config: _Config = config;
