var Async = require('async');
var Fs = require('fs');
var Mkdirp = require('mkdirp');
var Path = require('path');
var FsExtra = require('fs-extra');
var Gm = require('gm');
var Mime = require('mime');
var Uuid = require('node-uuid');
var FileUploader = (function () {
    function FileUploader() {
    }
    FileUploader.prototype.createToken = function () {
        return Uuid.v1();
    };
    FileUploader.prototype.upload = function (file, fileName, pathToUpload, callback) {
        Mkdirp.sync(pathToUpload);
        var path = this.getUniqueFileName(Path.join(pathToUpload, fileName));
        var fileStream = Fs.createWriteStream(path);
        fileStream.on('error', function (err) {
            return callback(err);
        });
        file.pipe(fileStream);
        file.on('end', function (err) {
            var ret = {
                filename: Path.parse(path).base
            };
            return callback(null, ret);
        });
        return file;
    };
    FileUploader.prototype.syncFiles = function (srcDir, targetDir, callback) {
        FsExtra.removeSync(targetDir);
        Mkdirp.sync(srcDir);
        Mkdirp.sync(targetDir);
        FsExtra.copySync(srcDir, targetDir);
        var files = this.getFiles(targetDir);
        return callback(null, {
            'files': files
        });
    };
    FileUploader.prototype.removeFile = function (path, callback) {
        return FsExtra.remove(path, callback);
    };
    FileUploader.prototype.createThumbnails = function (path, thumbnails, callback) {
        var _this = this;
        var files = this.getFiles(path);
        var array = {};
        return Async.eachSeries(files, function (f, _callback) {
            var file = Path.join(path, f);
            if (_this.isImage(file)) {
                Async.eachSeries(thumbnails, function (thumbnail, __callback) {
                    return _this.createThumbnail(file, path, thumbnail, __callback);
                }, function (err) {
                    return _callback(err);
                });
            }
            else {
                return _callback();
            }
        }, function (err) {
            return callback(err);
        });
    };
    FileUploader.prototype.createThumbnail = function (file, targetPath, thumbnail, callback) {
        if (!this.checkFileExists(file)) {
            return callback('file doesnot exist');
        }
        if (!this.isImage(file)) {
            return callback('file is not a image');
        }
        var name = thumbnail.name;
        var width = thumbnail.width;
        var height = thumbnail.height;
        var dest = Path.join(targetPath, name);
        var filename = Path.parse(file).base;
        var thumbnailPath = Path.join(dest, filename);
        Mkdirp.sync(dest);
        if (this.checkFileExists(thumbnailPath)) {
            return callback();
        }
        return Gm(file)
            .resize(width, height)
            .noProfile()
            .write(thumbnailPath, function (err) {
            return callback(err);
        });
    };
    FileUploader.prototype.getUniqueFileName = function (file) {
        var parseData = Path.parse(file);
        var dir = parseData.dir;
        var fileName = parseData.name;
        var ext = parseData.ext;
        var i = 1;
        while (true) {
            if (!this.checkFileExists(file)) {
                break;
            }
            file = Path.join(dir, fileName + '_' + i + ext);
            i = i + 1;
        }
        return file;
    };
    FileUploader.prototype.isImage = function (file) {
        var mime = Mime.lookup(file);
        var regex = new RegExp('image/\\S+');
        if (regex.test(mime)) {
            return true;
        }
        return false;
    };
    FileUploader.prototype.checkFileExists = function (file) {
        try {
            var stats = Fs.statSync(file);
            return stats.isFile();
        }
        catch (e) {
            return false;
        }
    };
    FileUploader.prototype.getFiles = function (path) {
        return Fs.readdirSync(path);
    };
    return FileUploader;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileUploader;
