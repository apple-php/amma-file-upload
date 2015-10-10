import Hapi = require("hapi");
import Boom = require("boom");
import Async = require('async');
import Fs = require('fs');
import Mkdirp = require('mkdirp');
import Path = require('path');
import FsExtra = require('fs-extra');
import Gm = require('gm');
import Mime = require('mime');
import Uuid = require('node-uuid');
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

  createToken(): string {
    return Uuid.v1();
  }

  upload(file: Fs.ReadStream, fileName: string, pathToUpload: string, callback: ICallback): Fs.ReadStream {
    Mkdirp.sync(pathToUpload);
    let path = this.getUniqueFileName(Path.join(pathToUpload, fileName));
    let fileStream = Fs.createWriteStream(path);
    fileStream.on('error', (err) => {
      return callback(err);
    });
    file.pipe(fileStream);
    file.on('end', (err) => {
      let ret = {
        filename: Path.parse(path).base
      }
      return callback(null, ret);
    });
    return file;
  }
  syncFiles(srcDir: string, targetDir: string, callback: ICallback): any {
    FsExtra.removeSync(targetDir);
    Mkdirp.sync(srcDir);
    Mkdirp.sync(targetDir);
    FsExtra.copySync(srcDir, targetDir);
    let files = this.getFiles(targetDir);
    return callback(null, {
      'files': files
    });
  }
  removeFile(path, callback: (err?: any, results?: any) => any) {
    return FsExtra.remove(path, callback);
  }

  createThumbnails(path: string, thumbnails: IThumbnail[], callback: ICallback): any {
    let files = this.getFiles(path);
    let array = {};
    return Async.eachSeries(files,
      (f: string, _callback: ICallback) => {
        var file = Path.join(path, f);
        if (this.isImage(file)) {
          Async.eachSeries(
            thumbnails,
            (thumbnail: IThumbnail, __callback: ICallback) => {
              return this.createThumbnail(file, path, thumbnail, __callback);
            },
            (err: any) => {
              return _callback(err);
            });
        } else {
          return _callback();
        }
      },
      (err: any) => {
        return callback(err);
      });
  }

  createThumbnail(file: string, targetPath: string, thumbnail: IThumbnail, callback: ICallback): any {
    if (!this.checkFileExists(file)) {
      return callback('file doesnot exist');
    }
    if (!this.isImage(file)) {
      return callback('file is not a image');
    }
    let name = thumbnail.name;
    let width = thumbnail.width;
    let height = thumbnail.height;
    let dest = Path.join(targetPath, name);
    let filename = Path.parse(file).base;
    let thumbnailPath = Path.join(dest, filename);
    Mkdirp.sync(dest);
    if (this.checkFileExists(thumbnailPath)) {
      return callback();
    }
    return Gm(file)
      .resize(width, height)
      .noProfile()
      .write(thumbnailPath, function(err) {
      return callback(err);
    });
  }

  getUniqueFileName(file: string): string {
    let parseData = Path.parse(file);
    let dir = parseData.dir;
    let fileName = parseData.name;
    let ext = parseData.ext;
    let i = 1;
    while (true) {
      if (!this.checkFileExists(file)) {
        break;
      }
      file = Path.join(dir, fileName + '_' + i + ext);
      i = i + 1;
    }
    return file;
  }

  isImage(file: string): boolean {
    let mime = Mime.lookup(file);
    let regex = new RegExp('image/\\S+');
    if (regex.test(mime)) {
      return true;
    }
    return false;
  }

  checkFileExists(file: string): boolean {
    try {
      let stats = Fs.statSync(file);
      return stats.isFile();
    }
    catch (e) {
      return false;
    }
  }

  getFiles(path: string): string[] {
    return Fs.readdirSync(path);
  }

}
