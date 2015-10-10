var Path = require('path');
var Async = require('async');
var FileUploadHelper = (function () {
    function FileUploadHelper(fileUploader, options) {
        this.fileUploader = fileUploader;
        this.options = options;
    }
    FileUploadHelper.prototype.getImages = function (extPath, callback) {
        var token = this.fileUploader.createToken();
        this.syncSrcToTemp(token, extPath, function (error, results) {
            callback(error, {
                token: token,
                files: results.files
            });
        });
    };
    FileUploadHelper.prototype.upload = function (token, file, fileName, callback) {
        var tempDir = this.getTempDirWithToken(token);
        if (!this.isValid(fileName)) {
            return callback('Invalid file');
        }
        this.fileUploader.upload(file, fileName, tempDir, callback);
    };
    FileUploadHelper.prototype.syncTempToSrc = function (token, extPath, callback) {
        var _this = this;
        var srcDir = this.getSrcDirWithExt(extPath);
        var tempDir = this.getTempDirWithToken(token);
        Async.series({
            sync: function (next) {
                _this.sync(tempDir, srcDir, next);
            },
            thumbnails: function (next) {
                _this.fileUploader.createThumbnails(srcDir, _this.options.thumbnails, next);
            },
            removeFiles: function (next) {
                _this.fileUploader.removeFile(tempDir, next);
            }
        }, function (error, results) {
            callback(error, { files: results.sync.files });
        });
    };
    FileUploadHelper.prototype.removeFile = function (token, fileName, callback) {
        var tempDir = this.getTempDirWithToken(token);
        var path = Path.join(tempDir, fileName);
        console.log(path);
        this.fileUploader.removeFile(path, callback);
    };
    FileUploadHelper.prototype.syncSrcToTemp = function (token, extPath, callback) {
        var _this = this;
        var srcDir = this.getSrcDirWithExt(extPath);
        var tempDir = this.getTempDirWithToken(token);
        Async.series({
            sync: function (next) {
                _this.sync(srcDir, tempDir, next);
            }
        }, function (error, results) {
            callback(error, { files: results.sync.files });
        });
    };
    FileUploadHelper.prototype.sync = function (src, target, callback) {
        return this.fileUploader.syncFiles(src, target, callback);
    };
    FileUploadHelper.prototype.getSrcDirWithExt = function (ext) {
        return Path.join(this.options.srcDir, ext);
    };
    FileUploadHelper.prototype.getTempDirWithToken = function (token) {
        return Path.join(this.options.tempDir, token);
    };
    FileUploadHelper.prototype.isValid = function (fileName) {
        var parts = Path.parse(fileName);
        var ext = parts.ext;
        var options = this.options;
        if (options.validExtensions && options.validExtensions instanceof Array) {
            if (options.validExtensions.indexOf(ext) != -1) {
                return true;
            }
            return false;
        }
        return true;
    };
    return FileUploadHelper;
})();
exports.FileUploadHelper = FileUploadHelper;
var FileUploaderFactory = (function () {
    function FileUploaderFactory(_server) {
        this._server = _server;
    }
    FileUploaderFactory.prototype.getFileUploader = function () {
        return this._server.plugins['amma-file-upload'].fileUpload;
    };
    FileUploaderFactory.prototype.get = function (options) {
        var fileUploader = this.getFileUploader();
        return new FileUploadHelper(fileUploader, options);
    };
    return FileUploaderFactory;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileUploaderFactory;
