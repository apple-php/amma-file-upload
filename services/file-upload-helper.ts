import AmmaFileUpload = require('./file-upload');
import Path = require('path');
import Async = require('async');
import Fs = require('fs');
import Hapi = require('hapi');

export interface Ioptions {
    tempDir: string;
    srcDir: string;
    thumbnails?: AmmaFileUpload.IThumbnail[],
    validExtensions?: string[]
}

export interface ICallback {
    (err?:any, results?:any): any;
}
export class FileUploadHelper {
    constructor(public fileUploader:AmmaFileUpload.IFileUploader, public options:Ioptions) {

    }


    createToken(extPath:string, callback:ICallback):string {
        let token = this.fileUploader.createToken();
        if (extPath) {

            this.syncSrcToTemp(token, extPath, (error, results) => {
                return callback(error, {
                    token: token,
                    files: this.getFilesByToken(token)
                });
            });
        }
        else {
            return callback(null, {
                token: token,
                files: []
            });
        }
    }

    getFilesByToken(token:string):string[] {
        let tempDir = this.getTempDirWithToken(token);
        return this.fileUploader.getFiles(tempDir);
    }

    getFiles(extPath:string, callback:ICallback):void {
        let srcDir = this.getSrcDirWithExt(extPath);
        let files = this.getValidFiles(srcDir);
        let result = {
            main: files
        };
        let thumbails = this.options.thumbnails;
        for (let i = 0; i < thumbails.length; i++) {
            let name = thumbails[i].name;
            result[name] = this.getValidFiles(Path.join(srcDir, name));
        }
        callback(null, result);
    }


    upload(token:string, file:Fs.ReadStream, fileName:string, callback:ICallback):void {
        let tempDir = this.getTempDirWithToken(token);
        if (!this.isValid(fileName)) {
            return callback('Invalid file');
        }
        this.fileUploader.upload(file, fileName, tempDir, callback);
    }

    syncTempToSrc(token:string, extPath:string, callback:ICallback):void {
        let srcDir = this.getSrcDirWithExt(extPath);
        let tempDir = this.getTempDirWithToken(token);
        Async.series({
            sync: (next) => {
                this.sync(tempDir, srcDir, next);
            },
            thumbnails: (next) => {
                this.fileUploader.createThumbnails(srcDir, this.options.thumbnails, next);
            },
            removeFiles: (next) => {
                this.fileUploader.removeFile(tempDir, next);
            }
        }, (error:any, results:any) => {
            callback(error, {files: results.sync.files});
        });
    }

    removeFile(token, fileName, callback:ICallback) {
        let tempDir = this.getTempDirWithToken(token);
        let path = Path.join(tempDir, fileName);
        this.fileUploader.removeFile(path, callback);
    }

    syncSrcToTemp(token:string, extPath:string, callback:ICallback):void {
        let srcDir = this.getSrcDirWithExt(extPath);
        let tempDir = this.getTempDirWithToken(token);
        Async.series({
            sync: (next) => {
                this.sync(srcDir, tempDir, next);
            }
        }, (error:any, results:any) => {
            callback(error, {files: results.sync.files});
        });
    }

    protected sync(src:string, target:string, callback:ICallback) {
        return this.fileUploader.syncFiles(src, target, callback);
    }

    protected getSrcDirWithExt(ext:string):string {
        return Path.join(this.options.srcDir, ext);
    }

    protected getTempDirWithToken(token:string):string {
        return Path.join(this.options.tempDir, token);
    }

    protected isValid(fileName) {
        let parts = Path.parse(fileName);
        let ext = parts.ext;
        let options = this.options;
        if (options.validExtensions && options.validExtensions instanceof Array) {
            if (options.validExtensions.indexOf(ext) != -1) {
                return true;
            }
            return false;
        }
        return true;
    }

    protected getValidFiles(dir) {
        let files = this.fileUploader.getFiles(dir);
        let result = [];
        for (let i = 0; i < files.length; i++) {
            let filePath = Path.join(dir, files[i]);
            let isFile = Fs.lstatSync(filePath).isFile();
            if (isFile && this.isValid(files[i])) {
                result.push(files[i]);
            }
        }
        return result;
    }

}

export default class FileUploaderFactory {
    constructor(public _server:Hapi.Server) {

    }

    getFileUploader():AmmaFileUpload.IFileUploader {
        return this._server.plugins['amma-file-upload'].fileUpload;
    }

    get(options:Ioptions):FileUploadHelper {
        let fileUploader = this.getFileUploader();
        return new FileUploadHelper(fileUploader, options);
    }

}
