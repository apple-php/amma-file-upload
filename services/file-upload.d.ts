import Fs = require('fs');
export interface IThumbnail {
    name: string;
    width: number;
    height?: number;
}
export interface ICallback {
    (err?: any, results?: any): any;
}
export interface IFileUploader {
    createToken(): string;
    upload(file: Fs.ReadStream, fileName: string, pathToUpload: string, callback: ICallback): Fs.ReadStream;
    syncFiles(srcDir: string, targetDir: string, callback: ICallback): any;
    removeFile(path: any, callback: (err?: any, results?: any) => any): any;
    createThumbnails(path: string, thumbnails: IThumbnail[], callback: ICallback): any;
    createThumbnail(file: string, targetPath: string, thumbnail: IThumbnail, callback: ICallback): any;
    getUniqueFileName(file: string): string;
    isImage(file: string): boolean;
    checkFileExists(file: string): boolean;
    getFiles(path: string): string[];
}
export default class FileUploader implements IFileUploader {
    createToken(): string;
    upload(file: Fs.ReadStream, fileName: string, pathToUpload: string, callback: ICallback): Fs.ReadStream;
    syncFiles(srcDir: string, targetDir: string, callback: ICallback): any;
    removeFile(path: any, callback: (err?: any, results?: any) => any): void;
    createThumbnails(path: string, thumbnails: IThumbnail[], callback: ICallback): any;
    createThumbnail(file: string, targetPath: string, thumbnail: IThumbnail, callback: ICallback): any;
    getUniqueFileName(file: string): string;
    isImage(file: string): boolean;
    checkFileExists(file: string): boolean;
    getFiles(path: string): string[];
}
