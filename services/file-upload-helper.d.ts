import AmmaFileUpload = require('file-upload');
import Fs = require('fs');
import Hapi = require('hapi');
export interface Ioptions {
    tempDir: string;
    srcDir: string;
    thumbnails?: AmmaFileUpload.IThumbnail[];
    validExtensions?: string[];
}
export interface ICallback {
    (err?: any, results?: any): any;
}
export declare class FileUploadHelper {
    fileUploader: AmmaFileUpload.IFileUploader;
    options: Ioptions;
    constructor(fileUploader: AmmaFileUpload.IFileUploader, options: Ioptions);
    getImages(extPath: string, callback: ICallback): void;
    upload(token: string, file: Fs.ReadStream, fileName: string, callback: ICallback): void;
    syncTempToSrc(token: string, extPath: string, callback: ICallback): void;
    removeFile(token: any, fileName: any, callback: ICallback): void;
    syncSrcToTemp(token: string, extPath: string, callback: ICallback): void;
    protected sync(src: string, target: string, callback: ICallback): any;
    protected getSrcDirWithExt(ext: string): string;
    protected getTempDirWithToken(token: string): string;
    protected isValid(fileName: any): boolean;
}
export default class FileUploaderFactory {
    _server: Hapi.Server;
    constructor(_server: Hapi.Server);
    getFileUploader(): AmmaFileUpload.IFileUploader;
    get(options: Ioptions): FileUploadHelper;
}
